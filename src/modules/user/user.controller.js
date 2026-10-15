import { Router } from "express";
import { enums, response, localMulter } from "../../common/index.js";
import * as middleware from "../../middleware/index.js";
import * as us from "./user.service.js";
import * as validators from "./user.validation.js";

const router = Router({ caseSensitive: true, strict: true });

router.get("/profile", middleware.authentication(), async (req, res) => {
  const user = await us.profile(req.user);
  return response.SuccessResponseHandling({
    res,
    message: "success.userRetrieved",
    data: user,
  });
});

router.get(
  "/all",
  middleware.authentication(),
  middleware.authorization(enums.RoleEnum.ADMIN),
  middleware.validation(validators.GetAllUsers),
  async (req, res) => {
    const users = await us.allUsers(req.user, req.validate.query);
    return response.SuccessResponseHandling({
      res,
      message: "success.usersRetrieved",
      data: users,
    });
  },
);

router.patch(
  "/update",
  middleware.authentication(),
  middleware.validation(validators.update),
  async (req, res) => {
    const updatedUser = await us.updateUser(req.user, req.validate.body);
    return response.SuccessResponseHandling({
      res,
      message: "success.userUpdated",
      data: updatedUser,
    });
  },
);

router.get(
  "/:userId/share-profile",
  middleware.validation(validators.shareProfile),
  async (req, res) => {
    const user = await us.shareProfile(req.params);
    return response.SuccessResponseHandling({
      res,
      message: "success.userRetrieved",
      data: user,
    });
  },
);

router.post(
  "/profile-image",
  middleware.authentication(),
  middleware.localMulterMiddleware({
    isRequired: true,
    customPath: "User",
    multerMiddleware: localMulter.memoryFileUpload().single("attachment"),
    validation: localMulter.fileValidation.image,
  }),
  middleware.validation(validators.profileImage),
  async (req, res) => {
    const data = await us.profileImage(req.user, req.validate.file);
    return response.SuccessResponseHandling({
      res,
      message: "success.userRetrieved",
      data,
    });
  },
);

export default router;
