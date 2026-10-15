import { models, queries } from "../../DB/index.js";

export const getAllConversations = async (conversation) => {
  return conversation.messages;
};

export const addNewMessageToConversation = async (
  conversation,
  content,
  files = [],
  user,
) => {
  return await queries.findByIdAndUpdate({
    model: models.ConversationModel,
    id: conversation._id,
    update: {
      $push: {
        messages: {
          senderId: user._id,
          content,
          attachments: files.map((ele) => ele.path),
        },
      },
    },
  });
};
