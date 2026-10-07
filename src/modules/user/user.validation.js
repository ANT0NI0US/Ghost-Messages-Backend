import { z } from "zod";
import { translate } from "../../common/translate/index.js";
import { generalValidationFields } from "../../common/validation.js";

export const update = (lang) => {
  return z.object({
    body: z.strictObject({
      firstName: z
        .string()
        .min(2, { error: translate(lang, "validation.firstName.min") })
        .max(30, { error: translate(lang, "validation.firstName.max") })
        .optional(),
      lastName: z
        .string()
        .min(2, { error: translate(lang, "validation.lastName.min") })
        .max(30, { error: translate(lang, "validation.lastName.max") })
        .optional(),
      phone: generalValidationFields(lang).phone.optional(),
      DOB: generalValidationFields(lang).DOB.optional(),
      gender: generalValidationFields(lang).gender.optional(),
    }),
  });
};

export const shareProfile = (lang) => {
  return z.object({
    params: z.strictObject({
      userId: generalValidationFields(lang).id,
    }),
  });
};
