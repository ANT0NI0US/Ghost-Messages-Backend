import express from "express";
import { BootstrapDB } from "./DB/connection.db.js";
import { globalErrorHandling } from "./middleware/error.middleware.js";
import { language } from "./middleware/language.middleware.js";
import { translate } from "./common/translate/index.js";
import {
  authController,
  messageController,
  userController,
} from "./modules/index.js";
import cors from "cors";

const app = express();

await BootstrapDB(app);

app.use(cors(), language, express.json());

app.all("/", (req, res) =>
  res.status(200).send({ message: translate(req.lang, "success.welcome") }),
);

app.use("/message", messageController);
app.use("/user", userController);
app.use("/auth", authController);

app.all("{/*dummy}", (req, res, next) => {
  res.status(404).json({
    message: translate(req.lang, "error.routeNotFound"),
  });
});

app.use(globalErrorHandling);
