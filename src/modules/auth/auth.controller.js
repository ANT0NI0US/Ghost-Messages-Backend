import { Router } from "express";
import { TokenTypeEnum } from "../../common/enum/index.js";
import { SuccessResponseHandling } from "../../common/utils/response.utils.js";
import { authentication, validation } from "../../middleware/index.js";
import {
  confirmEmail,
  confirmTwoStepVerification,
  enableTwoStepVerification,
  login,
  loginConfirmation,
  logout,
  requestForgetPasswordCode,
  reSendConfirmEmail,
  resetPassword,
  rotateToken,
  signup,
  signupLoginWithGmail,
  verifyForgotPasswordCode,
} from "./auth.service.js";
import * as validators from "./auth.validation.js";

const router = Router();

router.post("/signup-with-gmail", async (req, res) => {
  const issuer = `${req.protocol}://${req.host}`;
  const { status, ...tokens } = await signupLoginWithGmail(req.body, issuer);

  return SuccessResponseHandling({
    res,
    status,
    message: status == 200 ? "success.gmailLogin" : "success.gmailSignup",
    data: tokens,
  });
});

router.post("/signup", validation(validators.signup), async (req, res) => {
  await signup(req.validate.body);

  return SuccessResponseHandling({
    res,
    status: 201,
    message: "success.signup",
  });
});

router.patch(
  "/confirm-email",
  validation(validators.confirmEmail),
  async (req, res) => {
    const issuer = `${req.protocol}://${req.host}`;

    const tokens = await confirmEmail(req.validate.body, issuer);

    return SuccessResponseHandling({
      res,
      message: "success.emailConfirmed",
      data: tokens,
    });
  },
);

router.patch(
  "/resend-confirm-email",
  validation(validators.reSendConfirmEmail),
  async (req, res) => {
    await reSendConfirmEmail(req.validate.body);

    return SuccessResponseHandling({
      res,
      message: "success.otpSent",
    });
  },
);

router.post("/login", validation(validators.login), async (req, res) => {
  const issuer = `${req.protocol}://${req.host}`;
  const tokens = await login(req.validate.body, issuer);

  return SuccessResponseHandling({
    res,
    message: tokens ? "success.login" : "success.otpSent",
    data: tokens,
  });
});

router.patch(
  "/login-confirmation",
  validation(validators.loginConfirmation),
  async (req, res) => {
    const issuer = `${req.protocol}://${req.host}`;

    const tokens = await loginConfirmation(req.validate.body, issuer);

    return SuccessResponseHandling({
      res,
      message: "success.login",
      data: tokens,
    });
  },
);

// 2_STEP_VERIFICATION
router.post(
  "/enable-two-step-verification",
  authentication(),
  async (req, res) => {
    await enableTwoStepVerification(req.user);

    return SuccessResponseHandling({
      res,
      message: "success.otpSent",
    });
  },
);

router.patch(
  "/confirm-two-step-verification",
  authentication(),
  validation(validators.confirmTwoStepVerification),
  async (req, res) => {
    await confirmTwoStepVerification(req.user, req.validate.body);

    return SuccessResponseHandling({
      res,
      message: "success.twoStepVerificationEnabled",
    });
  },
);

// FORGOT PASSWORD
router.post(
  "/request-forgot-password-code",
  validation(validators.requestForgetPasswordCode),
  async (req, res) => {
    await requestForgetPasswordCode(req.validate.body);

    return SuccessResponseHandling({
      res,
      message: "success.otpSent",
    });
  },
);

router.post(
  "/verify-forgot-password-code",
  validation(validators.verifyForgotPasswordCode),
  async (req, res) => {
    await verifyForgotPasswordCode(req.validate.body);

    return SuccessResponseHandling({
      res,
      message: "success.otpVerified",
    });
  },
);

router.patch(
  "/reset-password",
  validation(validators.resetPassword),
  async (req, res) => {
    await resetPassword(req.validate.body);

    return SuccessResponseHandling({
      res,
      message: "success.passwordReset",
    });
  },
);

router.post(
  "/rotate-token",
  authentication(TokenTypeEnum.REFRESH),
  async (req, res) => {
    const issuer = `${req.protocol}://${req.host}`;
    const tokens = await rotateToken(req.payload, req.user, issuer);

    return SuccessResponseHandling({
      res,
      message: "success.tokensRotated",
      data: tokens,
    });
  },
);

router.post("/logout", authentication(), async (req, res) => {
  await logout(req.payload, req.user, req.body);

  return SuccessResponseHandling({
    res,
    message: "success.logout",
  });
});

export default router;
