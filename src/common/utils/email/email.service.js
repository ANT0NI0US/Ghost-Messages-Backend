import nodemailer from "nodemailer";
import configService from "../../../../config/config.service.js";
import { enums, events, exceptions, security, services } from "../../index.js";
import { transporter } from "./email.config.js";
import { createOtp } from "./otp.js";

export const UserEmailKey = ({ email, subject }) => {
  return `User::${email}::${subject}_OTP`;
};

export const UserOtpTrialsKey = ({ email, subject }) => {
  return `${UserEmailKey({ email, subject })}::Trials`;
};

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

export const UserOtpAttemptsKey = ({ email, subject }) => {
  return `${UserEmailKey({ email, subject })}::Attempts`;
};

export const sendEmailOtp = async ({
  email,
  lang,
  subject = enums.EmailSubjectEnum.CONFIRM_EMAIL,
  maxTrials = configService.MAX_OTP_TRIALS,
  otpExpiresTime = configService.OTP_EXPIRES_TIME,
  blockOtpTime = configService.BLOCK_OTP_TIME,
}) => {
  const existOtpTTL = await services.ttl({
    key: UserEmailKey({ email, subject }),
  });

  if (existOtpTTL > 0) {
    throw exceptions.ConflictException({ message: "error.otpStillValid" });
  }

  const currentTrials =
    (await services.get({
      key: UserOtpTrialsKey({ email, subject }),
    })) ?? 0;

  if (currentTrials >= maxTrials) {
    throw exceptions.TooManyRequestException({
      message: "error.otpLimitReached",
    });
  }

  const otp = createOtp();

  await services.set({
    key: UserEmailKey({ email, subject }),
    value: await security.hash({ plainText: otp }),
    ttl: otpExpiresTime,
  });

  const finalTrials = await services.incrBy({
    key: UserOtpTrialsKey({ email, subject }),
  });

  if (finalTrials == 1 || finalTrials == maxTrials) {
    await services.expire({
      key: UserOtpTrialsKey({ email, subject }),
      ttl: blockOtpTime,
    });
  }

  events.emailEvent.emit(enums.EventsEnum.SEND_EMAIL, {
    recipient: { to: email },
    subject,
    data: { code: otp, lang, expiresIn: Math.ceil(otpExpiresTime / 60) },
  });
};

export const checkOTP = async ({
  email,
  otp,
  subject = enums.EmailSubjectEnum.CONFIRM_EMAIL,
  maxAttempts = configService.MAX_OTP_ATTEMPTS,
}) => {
  const otpKey = UserEmailKey({ email, subject });
  const attemptsKey = UserOtpAttemptsKey({ email, subject });

  const hashOtp = await services.get({ key: otpKey });

  if (!hashOtp) {
    throw exceptions.BadRequestException({ message: "error.invalidOtp" });
  }

  const attempts = await services.incrBy({ key: attemptsKey });

  if (attempts == 1) {
    const otpTTL = await services.ttl({ key: otpKey });
    await services.expire({
      key: attemptsKey,
      ttl: Math.max(otpTTL, 1),
    });
  }

  if (attempts > maxAttempts) {
    await services.del({ key: [otpKey, attemptsKey] });
    throw exceptions.TooManyRequestException({
      message: "error.otpAttemptsExceeded",
    });
  }

  if (!(await security.compare(otp, hashOtp))) {
    throw exceptions.BadRequestException({ message: "error.invalidOtp" });
  }

  await services.del({ key: attemptsKey });
};
