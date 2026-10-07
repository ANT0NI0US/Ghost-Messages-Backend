import { z } from "zod";
import { translate } from "../../common/translate/index.js";
import { generalValidationFields } from "../../common/validation.js";

export const loginSchema = (lang) => {
  return z.strictObject({
    email: generalValidationFields(lang).email,
    password: generalValidationFields(lang).password,
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
        username: generalValidationFields(lang).username,
        phone: generalValidationFields(lang).phone,
        confirmPassword: generalValidationFields(lang).password,
        DOB: generalValidationFields(lang).DOB,
        gender: generalValidationFields(lang).gender,
      })
      .superRefine((data, ctx) => {
        generalValidationFields(lang).checkEquality({
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
    email: generalValidationFields(lang).email,
    otp: generalValidationFields(lang).otp,
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
      otp: generalValidationFields(lang).otp,
    }),
  });
};

export const reSendConfirmEmail = (lang) => {
  return z.object({
    body: z.strictObject({
      email: generalValidationFields(lang).email,
    }),
  });
};

export const requestForgetPasswordCode = (lang) => {
  return z.object({
    body: z.strictObject({
      email: generalValidationFields(lang).email,
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
        password: generalValidationFields(lang).password,
        confirmPassword: generalValidationFields(lang).password,
      }),
    })
    .superRefine((data, ctx) => {
      generalValidationFields(lang).checkEquality({
        original: "password",
        copy: "confirmPassword",
        data,
        ctx,
        lang,
        messageKey: "validation.password.mismatch",
      });
    });
};
