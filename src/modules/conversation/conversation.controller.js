import { Router } from "express";
import { fileUpload, sResponse } from "../../common/index.js";
import * as middleware from "../../middleware/index.js";
import * as cs from "./conversation.service.js";
import * as validators from "./conversation.validation.js";

const router = Router({ caseSensitive: true, strict: true });

const conversationFolderName = "conversations";

router.get(
  "/all",
  middleware.authentication(),
  middleware.validation(validators.getAllConversations),
  middleware.conversationAccess({ from: "query" }),
  async (req, res, next) => {
    const messages = await cs.getAllConversations(req.conversation);
    return sResponse.SuccessResponseHandling({
      res,
      message: "success.conversationMessagesRetrieved",
      data: messages,
    });
  },
);

router.post(
  "/create",
  middleware.authentication(),
  middleware.fileUploadMiddleware({
    isRequired: false,
    customPath: conversationFolderName,
    multerMiddleware: fileUpload.createUploader().array("attachments", 10),
    validation: [
      ...fileUpload.fileValidation.image,
      ...fileUpload.fileValidation.files,
    ],
  }),
  middleware.validation(validators.addNewMessageToConversation),
  middleware.conversationAccess({ from: "body" }),
  async (req, res, next) => {
    const messages = await cs.addNewMessageToConversation(
      req.conversation,
      req.validate.body.content,
      req.validate.files,
      req.user,
    );
    return sResponse.SuccessResponseHandling({
      res,
      message: "success.conversationMessageSent",
      data: messages,
    });
  },
);

export default router;
