import { z } from "zod";
import { GenderEnum } from "../../common/enum/index.js";

export const update = z.object({
  body: z.strictObject({
    firstName: z.string().min(2).max(30).optional(),
    lastName: z.string().min(2).max(30).optional(),
    phone: z.e164().optional(),
    DOB: z.coerce.date().optional(),
    gender: z.enum(GenderEnum).optional(),
  }),
});
