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

function buildIssueReportPdfBuffer({ userEmail, issues, summary }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 42, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const generatedAt = new Date().toISOString();
    doc.fontSize(20).text("Code Review Detailed Report", { align: "left" });
    doc.moveDown(0.35);
    doc.fontSize(10).fillColor("#4B5563");
    doc.text(`User: ${sanitizeText(userEmail)}`);
    doc.text(`Generated At (UTC): ${generatedAt}`);
    doc.moveDown(0.5);
    doc.fillColor("#111827").fontSize(11);
    doc.text(`Total Issues: ${summary.total}`);
    doc.text(`Critical: ${summary.critical}  |  Medium: ${summary.medium}  |  Low: ${summary.low}`);
    doc.moveDown(0.8);

    issues.forEach((issue, index) => {
      if (doc.y > 700) doc.addPage();

      doc
        .fontSize(12)
        .fillColor("#111827")
        .text(`${index + 1}. ${sanitizeText(issue.issue_title)}`, { underline: false });

      doc.fontSize(9).fillColor("#374151");
      doc.text(`Repository: ${sanitizeText(issue.repository_name)}`);
      doc.text(`File: ${sanitizeText(issue.file_name)}`);
      doc.text(`Severity: ${sanitizeText(issue.severity)}  |  Status: ${sanitizeText(issue.status)}`);
      doc.text(`Commit: ${sanitizeText(issue.commit_id)}  |  Date: ${sanitizeText(issue.created_at)}`);
      doc.moveDown(0.2);
      doc.fontSize(9).fillColor("#111827").text(`Description: ${sanitizeText(issue.issue_description)}`);
      doc.moveDown(0.15);
      doc.fontSize(9).fillColor("#065F46").text(`Suggested Fix: ${sanitizeText(issue.suggestion)}`);
      if (issue.optimization_tip) {
        doc.moveDown(0.15);
        doc.fontSize(9).fillColor("#1F2937").text(`Optimization Tip: ${sanitizeText(issue.optimization_tip)}`);
      }
      doc.moveDown(0.65);
      doc.strokeColor("#D1D5DB").lineWidth(0.6).moveTo(42, doc.y).lineTo(553, doc.y).stroke();
      doc.moveDown(0.55);
    });

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
};
