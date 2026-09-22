import { z } from "zod";
import { GenderEnum } from "../../common/enum/index.js";

export const login = z.strictObject({
  email: z.email(),
  password: z.string().min(8).max(16),
});

export const signup = login
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
  });
