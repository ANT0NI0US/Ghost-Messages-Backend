import mongoose from "mongoose";
import { DB_URI, PORT } from "../../config/config.service.js";
import { UserModel } from "./model/user.model.js";

export const BootstrapDB = async (app) => {
  try {
    await mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("DB CONNECTED 💥");
    await UserModel.syncIndexes();
    app.listen(PORT, () => {
      console.log(`we are running on port ${PORT}`);
    });
  } catch (error) {
    console.log("FAILED TO CONNECT DB ✖");
    console.log(error);
    process.exit(1);
  }
};
