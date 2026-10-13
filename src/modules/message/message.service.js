import { exceptions, enums } from "../../common/index.js";
import { models, queries } from "../../DB/index.js";

export const createMessage = async (
  { content, receiverId } = {},
  files = [],
  user = undefined,
) => {
  const checkReceiverExist = await queries.findById({
    model: models.UserModel,
    id: receiverId,
  });

  if (!checkReceiverExist) {
    throw exceptions.NotFoundException({ message: "error.invalidReceiver" });
  }

  const message = await queries.create({
    model: models.MessageModel,
    data: {
      receiverId,
      content,
      attachments: files.map((ele) => ele.path),
      ...(user ? { senderId: user._id } : {}),
    },
  });
  return message;
};

export const getAllMessages = async ({ type, page, limit } = {}, user) => {
  let filter = {};
  switch (type) {
    case enums.MessageTypeEnum.ALL:
      filter = {
        $or: [{ senderId: user._id }, { receiverId: user._id }],
      };
      break;

    case enums.MessageTypeEnum.SENDER:
      filter = { senderId: user._id };
      break;

    default:
      filter = { receiverId: user._id };
      break;
  }

  const data = await queries.paginate({
    model: models.MessageModel,
    filter,
    options: {
      sort: { createdAt: -1 },
    },
    page,
    limit,
  });

  return data;
};

export const deleteMessage = async ({ messageId } = {}, user) => {
  const data = await queries.deleteOne({
    model: models.MessageModel,
    filter: {
      _id: messageId,
      receiverId: user._id,
    },
  });
  if (!data.deletedCount) {
    throw exceptions.NotFoundException({ message: "error.invalidMessageId" });
  }
  return;
};

export const getMessageById = async ({ messageId } = {}, user) => {
  const message = await queries.findOne({
    model: models.MessageModel,
    filter: {
      _id: messageId,
      receiverId: user._id,
    },
  });
  if (!message) {
    throw exceptions.NotFoundException({ message: "error.messageNotFound" });
  }
  return message;
};
