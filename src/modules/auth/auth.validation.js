import { z } from "zod";
import { GenderEnum } from "../../common/enum/index.js";

export const loginSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(8).max(16),
});

export const login = z.object({
  body: loginSchema,
});

export const signup = z.object({
  body: loginSchema
    .safeExtend({
      username: z.string(),
      phone: z.e164(),
      confirmPassword: z.string().min(8).max(16),
      DOB: z.coerce.date(),
      gender: z.enum(GenderEnum).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.password != data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "password mismatch with confirm password",
        });
      }
      if (!data.username.includes(" ")) {
        ctx.addIssue({
          code: "custom",
          path: ["username"],
          message: "username must include 2 parts",
        });
      }
    }),
});
