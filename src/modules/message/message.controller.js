import { Router } from "express";
import { localMulter, response } from "../../common/index.js";
import * as middleware from "../../middleware/index.js";
import * as ms from "./message.service.js";
import * as validators from "./message.validation.js";

const router = Router();

const messageFolderName = "messages";

router.post(
  "/",
  async (req, res, next) => {
    if (req.headers["authorization"]) {
      await middleware.bearerAuth({ req });
    }
    next();
  },
  middleware.localMulterMiddleware({
    isRequired: false,
    customPath: messageFolderName,
    multerMiddleware: localMulter.localFileUpload().any("attachments", 3),
    validation: localMulter.fileValidation.image,
  }),
  middleware.validation(validators.createMessage),
  async (req, res, next) => {
    const data = await ms.createMessage(req.body, req.files, req.user);
    return response.SuccessResponseHandling({
      res,
      message: "success.messageCreated",
      status: 201,
      data,
    });
  },
);

router.get(
  "/all",
  middleware.authentication(),
  middleware.validation(validators.getAllMessages),
  async (req, res, next) => {
    const messages = await ms.getAllMessages(req.validate.query, req.user);
    return response.SuccessResponseHandling({
      res,
      message: "success.messagesRetrieved",
      data: messages,
    });
  },
);

router.get(
  "/:messageId",
  middleware.authentication(),
  middleware.validation(validators.getMessageById),
  async (req, res, next) => {
    const message = await ms.getMessageById(req.validate.params, req.user);
    return response.SuccessResponseHandling({
      res,
      message: "success.messageRetrieved",
      data: message,
    });
  },
);

router.delete(
  "/:messageId",
  middleware.authentication(),
  middleware.validation(validators.deleteMessage),
  async (req, res, next) => {
    await ms.deleteMessage(req.validate.params, req.user);
    return response.SuccessResponseHandling({
      res,
      message: "success.messageDeleted",
    });
  },
);

export default router;
