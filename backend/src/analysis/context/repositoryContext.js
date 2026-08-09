class RepositoryContext {
  constructor() {
    this.graph = {
      routes: [],
      middleware: [],
      sinks: [], // Database calls, external API calls
      exports: {}
    };
  }

  /**
   * Build a lightweight representation of the repository's code structure
   * @param {Array} files - List of file objects
   */
  build(files) {
    for (const file of files) {
      if (!file.content) continue;
      
      const ext = file.path.split('.').pop().toLowerCase();
      // Only process JS/TS for the lightweight AST/regex graph in this MVP
      if (!['js', 'ts', 'jsx', 'tsx'].includes(ext)) continue;

      const lines = file.content.split('\n');
      
      lines.forEach((line, idx) => {
        // Detect Express/Fastify style routes
        if (/app\.(get|post|put|delete|patch|use)\s*\(/.test(line)) {
          this.graph.routes.push({ file: file.path, line: idx + 1, code: line.trim() });
        }

        // Detect middleware functions (simple heuristic: uses next() or is named middleware)
        if (/(?:function\s+\w*middleware|const\s+\w*middleware\s*=|\bnext\s*\()/.test(line)) {
          this.graph.middleware.push({ file: file.path, line: idx + 1, code: line.trim() });
        }

        // Detect database sinks (supabase, prisma, raw query)
        if (/(?:supabase\.from|db\.query|prisma\.\w+\.find|mongoose\.model)/.test(line)) {
          this.graph.sinks.push({ file: file.path, line: idx + 1, code: line.trim(), type: 'database' });
        }
      });
    }

    return this.graph;
  }

  /**
   * Given a finding, returns relevant context (e.g., if finding is in a route file, return route info)
   */
  getContextForFinding(finding) {
    const relevantRoutes = this.graph.routes.filter(r => r.file === finding.file);
    const relevantSinks = this.graph.sinks.filter(s => s.file === finding.file);

    let contextSummary = `File ${finding.file} contains: `;
    if (relevantRoutes.length > 0) contextSummary += `\n- ${relevantRoutes.length} Route(s) (e.g. ${relevantRoutes[0].code})`;
    if (relevantSinks.length > 0) contextSummary += `\n- ${relevantSinks.length} DB Sink(s) (e.g. ${relevantSinks[0].code})`;

    return {
      summary: contextSummary,
      routes: relevantRoutes,
      sinks: relevantSinks
    };
  }
}

module.exports = RepositoryContext;
