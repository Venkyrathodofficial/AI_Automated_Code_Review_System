const nodemailer = require("nodemailer");
const { Client } = require("@notionhq/client");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DB_ID = process.env.NOTION_DB_ID;

// Email Alert
async function sendEmailAlert(issueData) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log("[ALERT] Email credentials not set");
    return;
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
  const mailOptions = {
    from: EMAIL_USER,
    to: EMAIL_USER, // Change to recipient if needed
    subject: `[CRITICAL] Code Review Alert: ${issueData.repository_name}`,
    text: `Critical issue detected!\n\nRepository: ${issueData.repository_name}\nFile: ${issueData.file_name}\nTitle: ${issueData.issue_title}\nSeverity: ${issueData.severity}\nSuggestion: ${issueData.suggestion}`,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log("[ALERT] Email sent for critical issue");
  } catch (err) {
    console.log("[ALERT] Email send error:", err.message);
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

module.exports = { sendEmailAlert, sendToNotion };
