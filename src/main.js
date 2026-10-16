import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { limiter, translate } from "./common/index.js";
import { BootstrapDB } from "./DB/connection.db.js";
import * as middleware from "./middleware/index.js";
import * as modules from "./modules/index.js";

const app = express();
await BootstrapDB(app);

const limiterMiddleware = limiter.generateRateLimiter();

app.set("trust proxy", true);
app.use(
  cors(),
  helmet(),
  morgan("dev"),
  middleware.language,
  limiterMiddleware,
  express.json(),
);
app.use("/assets", express.static("./assets")); // to i can access the files in the assets folder from the browser.

app.all("/", (req, res) =>
  res.status(200).send({ message: translate(req.lang, "success.welcome") }),
);

app.use("/message", modules.messageController);
app.use("/user", modules.userController);
app.use("/auth", modules.authController);
app.use("/request", modules.requestController);
app.use("/conversation", modules.conversationController);

app.all("{/*dummy}", (req, res, next) => {
  res.status(404).json({
    message: translate(req.lang, "error.routeNotFound"),
  });
});

app.use(middleware.globalErrorHandling);
