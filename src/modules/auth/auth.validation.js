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
