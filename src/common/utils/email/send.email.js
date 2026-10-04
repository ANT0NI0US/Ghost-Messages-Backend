import nodemailer from "nodemailer";
import {
  APP_EMAIL,
  APP_PASSWORD,
  APPLICATION_NAME,
} from "../../../../config/config.service.js";
import { BadRequestException } from "../../exceptions/error.exceptions.js";

export const UserEmailKey = ({ email, subject }) => {
  return `User::${email}::${subject}_OTP`;
};

export const UserOtpTrialsKey = ({ email, subject }) => {
  return `${UserEmailKey({ email, subject })}::Trials`;
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,

  auth: {
    user: APP_EMAIL,
    pass: APP_PASSWORD,
  },
});

export async function sendEmail({
  to,
  cc,
  bcc,
  subject,
  text,
  html,
  attachments = [],
} = {}) {
  try {
    if (!to?.length && !cc?.length && !bcc?.length) {
      throw BadRequestException({ message: "error.invalidRecipient" });
    }
    if (!text?.length && !html?.length && !attachments?.length) {
      throw BadRequestException({ message: "error.invalidEmailContent" });
    }

    const info = await transporter.sendMail({
      from: `"${APPLICATION_NAME}" <${APP_EMAIL}>`, // sender address
      to, // list of recipients
      cc,
      bcc,
      subject, // subject line
      text, // plain text body
      html, // HTML body
      attachments,
    });

    console.log("Message sent: %s", info.messageId);
    // Preview URL is only available when using an Ethereal test account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
}
