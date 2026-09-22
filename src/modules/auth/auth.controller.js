import { Router } from "express";
import { TokenTypeEnum } from "../../common/enum/index.js";
import { SuccessResponseHandling } from "../../common/utils/response.utils.js";
import { authentication, validation } from "../../middleware/index.js";
import {
  login,
  rotateToken,
  signup,
  signupLoginWithGmail,
} from "./auth.service.js";
import * as validators from "./auth.validation.js";

const router = Router();

router.post("/signup-with-gmail", async (req, res) => {
  const issuer = `${req.protocol}://${req.host}`;
  const { status, ...tokens } = await signupLoginWithGmail(req.body, issuer);

  return SuccessResponseHandling({
    res,
    status,
    message: `User ${status == 200 ? "login" : "signup"} with Gmail successfully`,
    data: tokens,
  });
});

router.post("/signup", validation(validators.signup), async (req, res) => {
  const issuer = `${req.protocol}://${req.host}`;
  const tokens = await signup(req.validate, issuer);

  return SuccessResponseHandling({
    res,
    status: 201,
    message: `user added successfully`,
    data: tokens,
  });
});

router.post("/login", validation(validators.login), async (req, res) => {
  const issuer = `${req.protocol}://${req.host}`;
  const tokens = await login(req.validate, issuer);

  return SuccessResponseHandling({
    res,
    message: `user logged in successfully`,
    data: tokens,
  });
});

router.post(
  "/rotate-token",
  authentication(TokenTypeEnum.REFRESH),
  async (req, res) => {
    const issuer = `${req.protocol}://${req.host}`;
    const tokens = await rotateToken(req.payload, req.user, issuer);

    return SuccessResponseHandling({
      res,
      message: `Get new tokens successfully`,
      data: tokens,
    });
  },
);

export default router;
