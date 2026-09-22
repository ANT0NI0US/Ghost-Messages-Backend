import { Router } from "express";
import { SuccessResponseHandling } from "../../common/utils/index.js";
import { authentication, validation } from "../../middleware/index.js";
import { profile, updateUser } from "./user.service.js";
import * as validators from "./user.validation.js";

const router = Router();

router.get("/profile", authentication(), async (req, res) => {
  const user = await profile(req.user);
  return SuccessResponseHandling({
    res,
    message: `user retrieved successfully`,
    data: user,
  });
});

router.patch(
  "/update",
  authentication(),
  validation(validators.update),
  async (req, res) => {
    const updatedUser = await updateUser(req.user, req.validate);
    return SuccessResponseHandling({
      res,
      message: `user updated successfully`,
      data: updatedUser,
    });
  },
);

export default router;
