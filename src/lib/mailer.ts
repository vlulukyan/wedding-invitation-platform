import nodemailer, { Transporter } from "nodemailer";
import type { RsvpPayload } from "@/lib/rsvpSchema";

interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  to: string;
}

let cachedTransporter: Transporter | null = null;
let cachedConfig: MailConfig | null = null;

function getMailConfig(): MailConfig | null {
  if (cachedConfig) {
    return cachedConfig;
  }

  const host = process.env.SMTP_HOST;
  const portValue = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.RSVP_FROM_EMAIL;
  const to = process.env.RSVP_NOTIFY_EMAIL;

  if (!host || !portValue || !from || !to) {
    return null;
  }

  const port = Number(portValue);
  if (Number.isNaN(port)) {
    throw new Error("SMTP_PORT must be a number.");
  }

  cachedConfig = {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user,
    pass,
    from,
    to,
  };
  return cachedConfig;
}

function getTransporter(): Transporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const config = getMailConfig();
  if (!config) {
    throw new Error("Email configuration is not set.");
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth:
      config.user && config.pass
        ? {
            user: config.user,
            pass: config.pass,
          }
        : undefined,
  });
  return cachedTransporter;
}

export async function sendRsvpEmail(payload: RsvpPayload, recordId: number): Promise<boolean> {
  const config = getMailConfig();
  if (!config) {
    return false;
  }

  const transporter = getTransporter();

  const attendingText = payload.attending === "yes" ? "will be attending" : "cannot attend";
  const lines = [
    `Name: ${payload.name}`,
    `Phone: ${payload.phone ?? "Not provided"}`,
    `Response: ${attendingText}`,
  ];

  if (payload.attending === "yes") {
    lines.push(`Guests: ${payload.guestCount}`);
  }

  const textBody = lines.join("\n");
  const htmlBody = `
    <p><strong>${payload.name}</strong> ${attendingText}.</p>
    <ul>
      <li><strong>Phone:</strong> ${payload.phone ?? "Not provided"}</li>
      ${payload.attending === "yes" ? `<li><strong>Guest count:</strong> ${payload.guestCount}</li>` : ""}
    </ul>
  `;

  await transporter.sendMail({
    from: config.from,
    to: config.to,
    subject: `New RSVP (#${recordId}): ${payload.name}`,
    text: textBody,
    html: htmlBody,
  });

  return true;
}
