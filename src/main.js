import express from "express";
import { BootstrapDB } from "./DB/connection.db.js";
import { globalErrorHandling } from "./middleware/error.middleware.js";
import {
  authController,
  messageController,
  userController,
} from "./modules/index.js";
import cors from "cors";

const app = express();

BootstrapDB(app);

app.use(cors(), express.json());

app.all("/", (req, res) =>
  res.status(200).send({ message: "Welcome to BE API 💖" }),
);

app.use("/message", messageController);
app.use("/user", userController);
app.use("/auth", authController);

app.all("{/*dummy}", (req, res, next) => {
  res.status(404).json({
    message: "Invalid app routing! ⚠",
  });
});

app.use(globalErrorHandling);
