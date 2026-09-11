import { Router } from "express";
import { SuccessResponseHandling } from "../../common/utils/response.utils.js";
import { login, signup } from "./auth.service.js";

const router = Router();

router.post("/signup", async (req, res) => {
  const user = await signup(req.body);

  return SuccessResponseHandling({
    res,
    status: 201,
    message: `user added successfully`,
    data: user,
  });
});

router.post("/login", async (req, res) => {
  const user = await login(req.body);

  return SuccessResponseHandling({
    res,
    message: `user retrieved successfully`,
    data: user,
  });
});

export default router;
