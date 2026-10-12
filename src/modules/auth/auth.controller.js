import { Router } from "express";
import { enums, response } from "../../common/index.js";
import * as middleware from "../../middleware/index.js";
import * as as from "./auth.service.js";
import * as validators from "./auth.validation.js";

const router = Router();

router.post("/signup-with-gmail", async (req, res) => {
  const issuer = `${req.protocol}://${req.host}`;
  const { status, ...tokens } = await as.signupLoginWithGmail(req.body, issuer);

  return response.SuccessResponseHandling({
    res,
    status,
    message: status == 200 ? "success.gmailLogin" : "success.gmailSignup",
    data: tokens,
  });
});

router.post(
  "/signup",
  middleware.validation(validators.signup),
  async (req, res) => {
    await as.signup(req.validate.body);

    return response.SuccessResponseHandling({
      res,
      status: 201,
      message: "success.signup",
    });
  },
);

router.patch(
  "/confirm-email",
  middleware.validation(validators.confirmEmail),
  async (req, res) => {
    const issuer = `${req.protocol}://${req.host}`;

    const tokens = await as.confirmEmail(req.validate.body, issuer);

    return response.SuccessResponseHandling({
      res,
      message: "success.emailConfirmed",
      data: tokens,
    });
  },
);

router.patch(
  "/resend-confirm-email",
  middleware.validation(validators.reSendConfirmEmail),
  async (req, res) => {
    await as.reSendConfirmEmail(req.validate.body);

    return response.SuccessResponseHandling({
      res,
      message: "success.otpSent",
    });
  },
);

router.post(
  "/login",
  middleware.validation(validators.login),
  async (req, res) => {
    const issuer = `${req.protocol}://${req.host}`;
    const tokens = await as.login(req.validate.body, issuer);

    return response.SuccessResponseHandling({
      res,
      message: tokens ? "success.login" : "success.otpSent",
      data: tokens,
    });
  },
);

router.patch(
  "/login-confirmation",
  middleware.validation(validators.loginConfirmation),
  async (req, res) => {
    const issuer = `${req.protocol}://${req.host}`;

    const tokens = await as.loginConfirmation(req.validate.body, issuer);

    return response.SuccessResponseHandling({
      res,
      message: "success.login",
      data: tokens,
    });
  },
);

// 2_STEP_VERIFICATION
router.post(
  "/enable-two-step-verification",
  middleware.authentication(),
  async (req, res) => {
    await as.enableTwoStepVerification(req.user);

    return response.SuccessResponseHandling({
      res,
      message: "success.otpSent",
    });
  },
);

router.patch(
  "/confirm-two-step-verification",
  middleware.authentication(),
  middleware.validation(validators.confirmTwoStepVerification),
  async (req, res) => {
    await as.confirmTwoStepVerification(req.user, req.validate.body);

    return response.SuccessResponseHandling({
      res,
      message: "success.twoStepVerificationEnabled",
    });
  },
);

// FORGOT PASSWORD
router.post(
  "/request-forgot-password-code",
  middleware.validation(validators.requestForgetPasswordCode),
  async (req, res) => {
    await as.requestForgetPasswordCode(req.validate.body);

    return response.SuccessResponseHandling({
      res,
      message: "success.otpSent",
    });
  },
);

router.post(
  "/verify-forgot-password-code",
  middleware.validation(validators.verifyForgotPasswordCode),
  async (req, res) => {
    await as.verifyForgotPasswordCode(req.validate.body);

    return response.SuccessResponseHandling({
      res,
      message: "success.otpVerified",
    });
  },
);

router.patch(
  "/reset-password",
  middleware.validation(validators.resetPassword),
  async (req, res) => {
    await as.resetPassword(req.validate.body);

    return response.SuccessResponseHandling({
      res,
      message: "success.passwordReset",
    });
  },
);

router.post(
  "/rotate-token",
  middleware.authentication(enums.TokenTypeEnum.REFRESH),
  async (req, res) => {
    const issuer = `${req.protocol}://${req.host}`;
    const tokens = await as.rotateToken(req.payload, req.user, issuer);

    return response.SuccessResponseHandling({
      res,
      message: "success.tokensRotated",
      data: tokens,
    });
  },
);

router.post(
  "/logout",
  middleware.authentication(),
  middleware.validation(validators.logout),
  async (req, res) => {
    await as.logout(req.payload, req.user, req.body);

    return response.SuccessResponseHandling({
      res,
      message: "success.logout",
    });
  },
);

export default router;
