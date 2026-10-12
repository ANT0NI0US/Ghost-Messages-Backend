import { EventEmitter } from "node:events";
import { enums } from "../index.js";
import { sendEmail } from "../utils/email/index.js";
import { emailTemplate } from "../utils/email/templates/confirmEmail.template.js";

export const emailEvent = new EventEmitter();

emailEvent.on(
  enums.EventsEnum.SEND_EMAIL,
  async ({ recipient, subject, data }) => {
    try {
      await sendEmail({
        ...recipient,
        subject,
        html: emailTemplate({ subject, data }),
      });
    } catch (error) {
      console.log(`Failed to send email`, error);
    }
  },
);
