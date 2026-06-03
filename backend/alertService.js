const nodemailer = require("nodemailer");
const { Client } = require("@notionhq/client");
const PDFDocument = require("pdfkit");
const fetch = require("node-fetch");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DB_ID = process.env.NOTION_DB_ID;
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

let transporter = null;

function getTransporter() {
  if (!EMAIL_USER || !EMAIL_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });
  }
  return transporter;
}

function sanitizeText(value) {
  if (value === null || value === undefined) return "-";
  return String(value).replace(/\s+/g, " ").trim() || "-";
}

function buildIssueReportPdfBuffer({ userEmail, issues, summary, extra = {} }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 42, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const generatedAt = new Date().toLocaleString();
    const repositoryName = extra.repositoryName || "All Connected Repositories";
    
    // Calculate Security Score & Grade if not provided
    let score = extra.securityScore;
    let grade = extra.securityGrade;
    if (score === undefined || score === null) {
      let criticalCount = summary.critical || 0;
      let highCount = summary.high || 0;
      let mediumCount = summary.medium || 0;
      let lowCount = summary.low || 0;
      const deductions = criticalCount * 15 + highCount * 10 + mediumCount * 5 + lowCount * 2;
      score = Math.max(0, 100 - deductions);
      
      grade = "D";
      if (score >= 95) grade = "A+";
      else if (score >= 90) grade = "A";
      else if (score >= 80) grade = "B";
      else if (score >= 70) grade = "C";
    }

    // 1. Draw Slate-900 Premium Header Banner
    doc.save();
    doc.rect(42, 42, 511, 60).fill("#0F172A");
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(18).text("SENTINEL AI SECURITY AUDIT", 58, 54);
    doc.fillColor("#94A3B8").font("Helvetica").fontSize(9).text("AUTOMATED CYBERSECURITY SCANNER & REMEDIATION REPORT", 58, 76);
    doc.restore();
    
    doc.y = 115;

    // 2. Draw Score & Grade Info Box
    doc.save();
    doc.rect(42, doc.y, 511, 75).fill("#F8FAFC");
    doc.rect(42, doc.y, 511, 75).strokeColor("#E2E8F0").lineWidth(1).stroke();
    
    // Grade Display
    let gradeColor = "#10B981"; // green
    if (grade === "B" || grade === "C") gradeColor = "#F59E0B"; // amber
    if (grade === "D") gradeColor = "#EF4444"; // red
    
    doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text("SECURITY GRADE", 58, doc.y + 12);
    doc.fillColor(gradeColor).font("Helvetica-Bold").fontSize(28).text(grade, 58, doc.y + 24);
    
    // Score Bar
    doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text("HEALTH SCORE", 180, doc.y + 12);
    doc.fillColor("#1E293B").font("Helvetica-Bold").fontSize(20).text(`${score}/100`, 180, doc.y + 24);
    
    // Metadata
    doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text("REPORT METADATA", 330, doc.y + 12);
    doc.font("Helvetica").fontSize(8).fillColor("#334155");
    doc.text(`Target Repo: ${sanitizeText(repositoryName)}`, 330, doc.y + 24);
    doc.text(`Scanned User: ${sanitizeText(userEmail)}`, 330, doc.y + 36);
    doc.text(`Report Date: ${generatedAt}`, 330, doc.y + 48);
    
    doc.restore();
    doc.y = doc.y + 90;

    // 3. Draw Summary Statistics
    doc.save();
    doc.fillColor("#1E293B").font("Helvetica-Bold").fontSize(11).text("VULNERABILITY SUMMARY", 42, doc.y);
    doc.y = doc.y + 15;
    
    const colWidth = 120;
    const startX = 42;
    const boxY = doc.y;
    
    const metrics = [
      { name: "CRITICAL", count: summary.critical || 0, color: "#EF4444" },
      { name: "HIGH", count: summary.high || 0, color: "#F97316" },
      { name: "MEDIUM", count: summary.medium || 0, color: "#F59E0B" },
      { name: "LOW", count: summary.low || 0, color: "#10B981" }
    ];
    
    metrics.forEach((m, idx) => {
      const boxX = startX + idx * colWidth;
      doc.rect(boxX, boxY, colWidth - 10, 35).fill("#F8FAFC");
      doc.rect(boxX, boxY, colWidth - 10, 35).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
      
      doc.fillColor(m.color).font("Helvetica-Bold").fontSize(12).text(String(m.count), boxX + 10, boxY + 6);
      doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(7).text(m.name, boxX + 10, boxY + 22);
    });
    doc.restore();
    doc.y = boxY + 55;

    // Divider
    doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(42, doc.y).lineTo(553, doc.y).stroke();
    doc.y = doc.y + 15;

    // Helper function to draw code blocks in PDF
    const drawCodeBlock = (title, codeText, bgColor, titleColor) => {
      if (!codeText || codeText.trim() === "" || codeText === "-") return;
      
      const width = 511;
      const verticalPadding = 12;
      const horizontalPadding = 10;
      
      doc.save();
      doc.font("Courier");
      doc.fontSize(7);
      
      const textHeight = doc.heightOfString(codeText, { width: width - horizontalPadding * 2 });
      const blockHeight = textHeight + verticalPadding * 2 + 10;
      
      // Page break check
      if (doc.y + blockHeight > 750) {
        doc.addPage();
      }
      
      const blockY = doc.y;
      doc.rect(42, blockY, width, blockHeight).fill(bgColor);
      doc.rect(42, blockY, width, blockHeight).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
      
      // Title header
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(titleColor).text(title, 42 + horizontalPadding, blockY + verticalPadding);
      // Code body
      doc.font("Courier").fontSize(7).fillColor("#1E293B").text(codeText, 42 + horizontalPadding, blockY + verticalPadding + 12, { width: width - horizontalPadding * 2 });
      
      doc.restore();
      doc.y = blockY + blockHeight + 10;
    };

    // 4. Draw Detailed Issues List
    doc.fillColor("#1E293B").font("Helvetica-Bold").fontSize(12).text("DETAILED SECURITY ISSUES", 42, doc.y);
    doc.y = doc.y + 15;

    if (issues.length === 0) {
      doc.font("Helvetica-Oblique").fontSize(9).fillColor("#64748B").text("No security vulnerabilities were identified in this scan.", 42, doc.y);
    } else {
      issues.forEach((issue, index) => {
        // Estimate issue header height
        const headerHeight = 110;
        if (doc.y + headerHeight > 730) {
          doc.addPage();
        }

        const issueY = doc.y;
        
        // Severity Tag Color
        let sevColor = "#10B981"; // green
        const sev = String(issue.severity || "").toLowerCase();
        if (sev === "critical") sevColor = "#EF4444";
        else if (sev === "high") sevColor = "#F97316";
        else if (sev === "medium") sevColor = "#F59E0B";

        // Issue Number & Title
        doc.save();
        doc.fillColor("#1E293B").font("Helvetica-Bold").fontSize(10).text(`${index + 1}. ${sanitizeText(issue.issue_title)}`, 42, issueY);
        
        // Severity Badge
        doc.rect(480, issueY - 1, 73, 13).fill(sevColor);
        doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(7).text(String(issue.severity).toUpperCase(), 480, issueY + 2, { width: 73, align: "center" });
        doc.restore();
        
        doc.y = issueY + 16;
        
        // File details
        doc.save();
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#475569");
        doc.text("File: ", 42, doc.y, { continued: true }).font("Helvetica").text(`${sanitizeText(issue.file_name)}${issue.line_number ? ` : Line ${issue.line_number}` : ""}`);
        doc.font("Helvetica-Bold").text("Category: ", 42, doc.y + 12, { continued: true }).font("Helvetica").text(sanitizeText(issue.category).replace(/_/g, " ").toUpperCase());
        doc.font("Helvetica-Bold").text("Impact Description: ", 42, doc.y + 24, { continued: true }).font("Helvetica").text(sanitizeText(issue.issue_description));
        doc.font("Helvetica-Bold").text("Remediation Recommendation: ", 42, doc.y + 36, { continued: true }).font("Helvetica").text(sanitizeText(issue.suggestion));
        doc.restore();
        
        doc.y = doc.y + 55;

        // Draw Snippets
        if (issue.snippet && issue.snippet !== "-") {
          drawCodeBlock("VULNERABLE CODE SNIPPET", issue.snippet, "#FEF2F2", "#EF4444");
        } else if (issue.offending_line && issue.offending_line !== "-") {
          drawCodeBlock("VULNERABLE LINE", issue.offending_line, "#FEF2F2", "#EF4444");
        }

        if (issue.secure_code && issue.secure_code !== "-" && issue.secure_code.trim() !== "") {
          drawCodeBlock("SECURE CODE REMEDIATION", issue.secure_code, "#F0FDF4", "#16A34A");
        }

        if (issue.best_practices && issue.best_practices !== "-" && issue.best_practices.trim() !== "") {
          doc.save();
          if (doc.y + 40 > 750) doc.addPage();
          doc.font("Helvetica-Bold").fontSize(8).fillColor("#16A34A").text("Remediation Best Practices:", 42, doc.y);
          doc.font("Helvetica").fontSize(8).fillColor("#334155").text(sanitizeText(issue.best_practices), 42, doc.y + 10, { width: 511 });
          doc.restore();
          doc.y = doc.y + 35;
        }

        doc.y = doc.y + 10;
        if (index < issues.length - 1) {
          if (doc.y + 30 > 750) doc.addPage();
          doc.strokeColor("#E2E8F0").lineWidth(0.5).moveTo(42, doc.y).lineTo(553, doc.y).stroke();
          doc.y = doc.y + 15;
        }
      });
    }

    doc.end();
  });
}

// Email Alert
async function sendEmailAlert(issueData) {
  const tx = getTransporter();
  if (!tx) {
    console.log("[ALERT] Email credentials not set");
    return;
  }

  const mailOptions = {
    from: EMAIL_USER,
    to: EMAIL_USER, // Change to recipient if needed
    subject: `[CRITICAL] Code Review Alert: ${issueData.repository_name}`,
    text: `Critical issue detected!\n\nRepository: ${issueData.repository_name}\nFile: ${issueData.file_name}\nTitle: ${issueData.issue_title}\nSeverity: ${issueData.severity}\nSuggestion: ${issueData.suggestion}`,
  };
  try {
    await tx.sendMail(mailOptions);
    console.log("[ALERT] Email sent for critical issue");
  } catch (err) {
    console.log("[ALERT] Email send error:", err.message);
  }
}

async function sendDetailedIssueReportEmail({ to, userName, issues }) {
  const tx = getTransporter();
  if (!tx) {
    throw new Error("Email credentials not set");
  }

  const summary = issues.reduce(
    (acc, issue) => {
      acc.total += 1;
      const sev = String(issue.severity || "").toLowerCase();
      if (sev === "critical") acc.critical += 1;
      else if (sev === "medium") acc.medium += 1;
      else acc.low += 1;
      return acc;
    },
    { total: 0, critical: 0, medium: 0, low: 0 }
  );

  const pdfBuffer = await buildIssueReportPdfBuffer({
    userEmail: to,
    issues,
    summary,
  });

  const subject = `Detailed Code Review Report (${summary.total} issues)`;
  const introName = userName ? `Hi ${userName},` : "Hi,";
  const textBody = [
    introName,
    "",
    "Attached is your detailed PDF code review report.",
    `Total issues: ${summary.total}`,
    `Critical: ${summary.critical}, Medium: ${summary.medium}, Low: ${summary.low}`,
    "",
    "The report includes repository names, file paths, issue details, and suggestions.",
  ].join("\n");

  await tx.sendMail({
    from: EMAIL_USER,
    to,
    subject,
    text: textBody,
    attachments: [
      {
        filename: `code-review-report-${new Date().toISOString().slice(0, 10)}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  return summary;
}

async function sendMobileReportReadyNotification({ externalUserId, title, message, url }) {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
    console.log("[ALERT] OneSignal credentials not set, skipping mobile notification");
    return false;
  }
  if (!externalUserId) return false;

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    include_external_user_ids: [String(externalUserId)],
    headings: { en: title || "Code Review Report Ready" },
    contents: { en: message || "Your detailed code review report is ready in your email." },
    url: url || undefined,
  };

  try {
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errText = await response.text();
      console.log("[ALERT] OneSignal notification error:", errText);
      return false;
    }
    return true;
  } catch (err) {
    console.log("[ALERT] OneSignal request failed:", err.message);
    return false;
  }
}

// Notion Alert
async function sendToNotion(issueData) {
  if (!NOTION_API_KEY || !NOTION_DB_ID) {
    console.log("[ALERT] Notion credentials not set");
    return;
  }
  const notion = new Client({ auth: NOTION_API_KEY });
  try {
    await notion.pages.create({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        "Issue Title": { title: [{ text: { content: issueData.issue_title } }] },
        "Severity": { select: { name: issueData.severity } },
        "Repository": { rich_text: [{ text: { content: issueData.repository_name } }] },
        "Commit Message": { rich_text: [{ text: { content: issueData.commit_message || "" } }] },
        "Status": { select: { name: "Open" } },
      },
    });
    console.log("[ALERT] Notion page created for critical issue");
  } catch (err) {
    console.log("[ALERT] Notion error:", err.message);
  }
}

module.exports = {
  sendEmailAlert,
  sendToNotion,
  sendDetailedIssueReportEmail,
  sendMobileReportReadyNotification,
  buildIssueReportPdfBuffer,
};
