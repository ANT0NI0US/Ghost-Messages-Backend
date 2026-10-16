import nodemailer from "nodemailer";
import configService from "../../../../config/config.service.js";
import { exceptions } from "../../../common/index.js";

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
    user: configService.APP_EMAIL,
    pass: configService.APP_PASSWORD,
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
      throw exceptions.BadRequestException({
        message: "error.invalidRecipient",
      });
    }
    if (!text?.length && !html?.length && !attachments?.length) {
      throw exceptions.BadRequestException({
        message: "error.invalidEmailContent",
      });
    }

    const info = await transporter.sendMail({
      from: `"${configService.APPLICATION_NAME}" <${configService.APP_EMAIL}>`,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments,
    });

    console.log("Message sent: %s", info.messageId);
    // Preview URL is only available when using an Ethereal test account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
}
