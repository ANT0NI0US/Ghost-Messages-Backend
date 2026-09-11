import { Router } from "express";
import { SuccessResponseHandling } from "../../common/utils/response.utils.js";

const router = Router();

router.post("/", async (req, res) => {
  return SuccessResponseHandling({
    res,
    status: 201,
    message: `Note created successfully`,
    data: note,
  });
});
export default router;
