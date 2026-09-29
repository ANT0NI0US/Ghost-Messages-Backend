import { z } from "zod";
import { GenderEnum } from "./enum/index.js";
import { translate } from "./translate/index.js";
import { Types } from "mongoose";

const EMAIL_REGEX =
  /^(?=.*[a-zA-Z]{5,25})(?=.*\d{0,5}).{1,30}@(gmail|yahoo|icloud)(\.com|\.net){1,2}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\s{0,})(?=.*[!@#$%^&*()_+\-=|";:<>?]).+$/;

// const EMAIL_REGEX = /^\w{1,100}@(gmail|yahoo|icloud)(\.com|\.net){1,2}$/;
// const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).+$/;
// const OTP_REGEX = /^\d{6}$/

const checkEquality = ({ original, copy, data, ctx, lang, messageKey }) => {
  if (data[original] != data[copy]) {
    ctx.addIssue({
      code: "custom",
      path: [copy],
      message: translate(lang, messageKey),
    });
  }
};

export const generalValidationFields = {
  email: (lang) =>
    z.email({
      pattern: EMAIL_REGEX,
      error: translate(lang, "validation.email.invalid"),
    }),
  password: (lang) =>
    z
      .string()
      .regex(PASSWORD_REGEX, {
        error: translate(lang, "validation.password.weak"),
      })
      .min(8, { error: translate(lang, "validation.password.min") })
      .max(16, { error: translate(lang, "validation.password.max") }),
  username: (lang) =>
    z.string().min(2, { error: translate(lang, "validation.username.min") }),
  firstName: (lang) =>
    z
      .string()
      .min(2, { error: translate(lang, "validation.firstName.min") })
      .max(30, { error: translate(lang, "validation.firstName.max") }),
  lastName: (lang) =>
    z
      .string()
      .min(2, { error: translate(lang, "validation.lastName.min") })
      .max(30, { error: translate(lang, "validation.lastName.max") }),
  phone: (lang) =>
    z.e164({ error: translate(lang, "validation.phone.invalid") }),
  DOB: (lang) =>
    z.coerce.date({ error: translate(lang, "validation.DOB.invalid") }),
  gender: (lang) =>
    z.enum(GenderEnum, { error: translate(lang, "validation.gender.invalid") }),
  id: (lang) =>
    z.string().refine((value) => Types.ObjectId.isValid(value), {
      error: translate(lang, "validation.userId.invalid"),
    }),
  checkEquality,
};
