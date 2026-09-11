import { Router } from "express";
import { SuccessResponseHandling } from "../../common/utils/response.utils.js";

const router = Router();

router.post("/", async (req, res) => {
  return SuccessResponseHandling({
    res,
    status: 201,
    message: `user added successfully`,
    data: user,
  });
});

export default router;
