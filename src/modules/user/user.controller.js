import { Router } from "express";
import { RoleEnum } from "../../common/enum/user.enum.js";
import {
  fileValidation,
  localFileUpload,
  SuccessResponseHandling,
} from "../../common/utils/index.js";
import {
  authentication,
  authorization,
  localMulterMiddleware,
  validation,
} from "../../middleware/index.js";
import {
  allUsers,
  profile,
  profileImage,
  shareProfile,
  updateUser,
} from "./user.service.js";
import * as validators from "./user.validation.js";

const router = Router();

router.get("/profile", authentication(), async (req, res) => {
  const user = await profile(req.user);
  return SuccessResponseHandling({
    res,
    message: "success.userRetrieved",
    data: user,
  });
});

router.get(
  "/all",
  authentication(),
  authorization(RoleEnum.ADMIN),
  async (req, res) => {
    const user = await allUsers(req.user);
    return SuccessResponseHandling({
      res,
      message: "success.usersRetrieved",
      data: user,
    });
  },
);

router.patch(
  "/update",
  authentication(),
  validation(validators.update),
  async (req, res) => {
    const updatedUser = await updateUser(req.user, req.validate.body);
    return SuccessResponseHandling({
      res,
      message: "success.userUpdated",
      data: updatedUser,
    });
  },
);

router.get(
  "/:userId/share-profile",
  validation(validators.shareProfile),
  async (req, res) => {
    const user = await shareProfile(req.params);
    return SuccessResponseHandling({
      res,
      message: "success.userRetrieved",
      data: user,
    });
  },
);

router.post(
  "/profile-image",
  authentication(),
  localMulterMiddleware({
    isRequired: true,
    customPath: "User",
    multerMiddleware: localFileUpload().single("attachment"),
    validation: fileValidation.image,
  }),
  async (req, res) => {
    const data = await profileImage(req.user, req.file);
    return SuccessResponseHandling({
      res,
      message: "success.userRetrieved",
      data,
    });
  },
);

export default router;
