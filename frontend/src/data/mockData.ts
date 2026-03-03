export interface Issue {
  id: string;
  repository: string;
  fileName: string;
  title: string;
  severity: "critical" | "medium" | "low";
  status: "open" | "resolved";
  date: string;
  description: string;
  suggestedFix: string;
  optimizationTip: string;
  commitMessage: string;
  commitId: string;
}

export const mockIssues: Issue[] = [
  {
    id: "1",
    repository: "frontend-app",
    fileName: "src/auth/login.ts",
    title: "SQL Injection vulnerability in login query",
    severity: "critical",
    status: "open",
    date: "2026-03-02",
    description: "User input is directly concatenated into SQL query string without sanitization, allowing potential SQL injection attacks.",
    suggestedFix: "Use parameterized queries or an ORM to handle user input safely.",
    optimizationTip: "Consider implementing prepared statements for all database queries across the application.",
    commitMessage: "feat: add user login endpoint",
    commitId: "a3f7c2d",
  },
  {
    id: "2",
    repository: "backend-api",
    fileName: "src/utils/crypto.ts",
    title: "Weak hashing algorithm used for passwords",
    severity: "critical",
    status: "open",
    date: "2026-03-01",
    description: "MD5 is used for password hashing which is cryptographically broken and unsuitable for password storage.",
    suggestedFix: "Replace MD5 with bcrypt or Argon2 for password hashing.",
    optimizationTip: "Set bcrypt cost factor to at least 12 for production environments.",
    commitMessage: "refactor: update user registration",
    commitId: "b8e1f4a",
  },
  {
    id: "3",
    repository: "frontend-app",
    fileName: "src/components/Dashboard.tsx",
    title: "Unused state variable causing re-renders",
    severity: "medium",
    status: "resolved",
    date: "2026-02-28",
    description: "A state variable is declared and updated but never used in the render output, causing unnecessary re-renders.",
    suggestedFix: "Remove the unused state variable or memoize the component.",
    optimizationTip: "Use React DevTools profiler to identify other unnecessary re-renders.",
    commitMessage: "fix: dashboard performance improvements",
    commitId: "c2d9e6b",
  },
  {
    id: "4",
    repository: "mobile-app",
    fileName: "lib/api/client.dart",
    title: "API key exposed in client-side code",
    severity: "critical",
    status: "open",
    date: "2026-02-27",
    description: "A private API key is hardcoded in the client-side source code, making it visible to anyone who decompiles the app.",
    suggestedFix: "Move the API key to environment variables and use a backend proxy.",
    optimizationTip: "Implement API key rotation and use short-lived tokens for client access.",
    commitMessage: "feat: integrate payment gateway",
    commitId: "d5f3a1c",
  },
  {
    id: "5",
    repository: "backend-api",
    fileName: "src/middleware/cors.ts",
    title: "CORS policy allows all origins",
    severity: "medium",
    status: "open",
    date: "2026-02-26",
    description: "The CORS middleware is configured with '*' allowing requests from any origin, which can lead to CSRF attacks.",
    suggestedFix: "Restrict CORS to specific trusted domains only.",
    optimizationTip: "Consider using a whitelist approach for allowed origins in production.",
    commitMessage: "chore: configure middleware stack",
    commitId: "e7g4b2d",
  },
  {
    id: "6",
    repository: "frontend-app",
    fileName: "src/utils/format.ts",
    title: "Console.log statements left in production code",
    severity: "low",
    status: "resolved",
    date: "2026-02-25",
    description: "Multiple console.log statements are present in production code, potentially leaking sensitive data to browser console.",
    suggestedFix: "Remove console.log statements or use a proper logging library with log levels.",
    optimizationTip: "Configure ESLint rule no-console to prevent accidental console statements.",
    commitMessage: "feat: add data formatting utilities",
    commitId: "f1h5c3e",
  },
  {
    id: "7",
    repository: "backend-api",
    fileName: "src/routes/users.ts",
    title: "Missing input validation on user endpoint",
    severity: "medium",
    status: "open",
    date: "2026-02-24",
    description: "The user update endpoint accepts any payload without validation, potentially allowing malformed or malicious data.",
    suggestedFix: "Add Zod or Joi schema validation for all request bodies.",
    optimizationTip: "Create reusable validation schemas shared between frontend and backend.",
    commitMessage: "feat: user profile update API",
    commitId: "g3i6d4f",
  },
  {
    id: "8",
    repository: "mobile-app",
    fileName: "lib/screens/settings.dart",
    title: "Deprecated API usage detected",
    severity: "low",
    status: "open",
    date: "2026-02-23",
    description: "Several deprecated Flutter APIs are used which may be removed in future versions.",
    suggestedFix: "Update to the recommended replacement APIs as per Flutter migration guide.",
    optimizationTip: "Set up dart analyze in CI to catch deprecated API usage early.",
    commitMessage: "feat: settings screen redesign",
    commitId: "h4j7e5g",
  },
];

export const statsData = {
  totalReviews: 1284,
  critical: 12,
  medium: 34,
  low: 67,
};
