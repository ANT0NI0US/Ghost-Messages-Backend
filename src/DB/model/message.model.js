import mongoose from "mongoose";
import { enums } from "../../common/index.js";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      minLength: [2, "validation.content.min"],
      maxLength: [50000, "validation.content.max"],
      required: function () {
        return this.attachments?.length > 0 ? false : true;
      },
    },
    attachments: [String],
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "validation.receiverId.required"],
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    autoIndex: true,
    strictQuery: true,
    optimisticConcurrency: true,
  },
);

export const MessageModel =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
