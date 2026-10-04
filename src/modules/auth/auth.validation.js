import { z } from "zod";
import { translate } from "../../common/translate/index.js";
import { generalValidationFields } from "../../common/validation.js";

export const loginSchema = (lang) => {
  return z.strictObject({
    email: generalValidationFields.email(lang),
    password: generalValidationFields.password(lang),
  });
};

export const login = (lang) => {
  return z.object({
    body: loginSchema(lang),
  });
};

export const signup = (lang) => {
  return z.object({
    body: loginSchema(lang)
      .safeExtend({
        username: generalValidationFields.username(lang),
        phone: generalValidationFields.phone(lang),
        confirmPassword: generalValidationFields.password(lang),
        DOB: generalValidationFields.DOB(lang),
        gender: generalValidationFields.gender(lang),
      })
      .superRefine((data, ctx) => {
        generalValidationFields.checkEquality({
          original: "password",
          copy: "confirmPassword",
          data,
          ctx,
          lang,
          messageKey: "validation.password.mismatch",
        });
        if (!data.username.includes(" ")) {
          ctx.addIssue({
            code: "custom",
            path: ["username"],
            message: translate(lang, "validation.username.twoParts"),
          });
        }
      }),
  });
};

export const confirmEmailSchema = (lang) => {
  return z.strictObject({
    email: generalValidationFields.email(lang),
    otp: generalValidationFields.otp(lang),
  });
};

export const confirmEmail = (lang) => {
  return z.object({
    body: confirmEmailSchema(lang),
  });
};

export const loginConfirmation = (lang) => {
  return z.object({
    body: confirmEmailSchema(lang),
  });
};

export const confirmTwoStepVerification = (lang) => {
  return z.object({
    body: z.strictObject({
      otp: generalValidationFields.otp(lang),
    }),
  });
};

export const reSendConfirmEmail = (lang) => {
  return z.object({
    body: z.strictObject({
      email: generalValidationFields.email(lang),
    }),
  });
};

export const requestForgetPasswordCode = (lang) => {
  return z.object({
    body: z.strictObject({
      email: generalValidationFields.email(lang),
    }),
  });
};

export const verifyForgotPasswordCode = (lang) => {
  return z.object({
    body: confirmEmailSchema(lang),
  });
};

export const resetPassword = (lang) => {
  return z
    .object({
      body: confirmEmailSchema(lang).safeExtend({
        password: generalValidationFields.password(lang),
        confirmPassword: generalValidationFields.password(lang),
      }),
    })
    .superRefine((data, ctx) => {
      generalValidationFields.checkEquality({
        original: "password",
        copy: "confirmPassword",
        data,
        ctx,
        lang,
        messageKey: "validation.password.mismatch",
      });
    });
};
