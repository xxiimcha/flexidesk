// src/utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_PORT) === "465", // true for 465
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

async function sendMail({ to, subject, html, text, from }) {
  const sender = from || process.env.SMTP_FROM || "no-reply@localhost";
  return transporter.sendMail({ from: sender, to, subject, html, text });
}

function isMailerConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

module.exports = { sendMail, isMailerConfigured };
