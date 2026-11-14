import mongoose from "mongoose";
import configService from "../../config/config.service.js";
import { models } from "./index.js";
import { connectRedis } from "./redis.connection.js";

export const BootstrapDB = async (app) => {
  try {
    await mongoose.connect(configService.DB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.info("DB CONNECTED 💥");

    if (configService.NODE_ENV === "development") {
      await models.UserModel.syncIndexes();
      await models.MessageModel.syncIndexes();
      await models.ConversationModel.syncIndexes();
      await models.RequestModel.syncIndexes();
    }

    await connectRedis();
    app.listen(configService.PORT, () => {
      console.info(`we are running on port ${configService.PORT}`);
    });
  } catch (error) {
    console.error("FAILED TO CONNECT DB ✖");
    console.error(error);
    process.exit(1);
  }
};
