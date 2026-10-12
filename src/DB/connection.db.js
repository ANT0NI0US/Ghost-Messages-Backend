import mongoose from "mongoose";
import configService from "../../config/config.service.js";
import { models } from "./index.js";
import { connectRedis } from "./redis.connection.js";

export const BootstrapDB = async (app) => {
  try {
    await mongoose.connect(configService.DB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("DB CONNECTED 💥");
    await models.UserModel.syncIndexes();
    await connectRedis();
    app.listen(configService.PORT, () => {
      console.log(`we are running on port ${configService.PORT}`);
    });
  } catch (error) {
    console.log("FAILED TO CONNECT DB ✖");
    console.log(error);
    process.exit(1);
  }
};
