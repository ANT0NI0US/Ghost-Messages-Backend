import cors from "cors";
import express from "express";
import { limiter, translate } from "./common/index.js";
import { BootstrapDB } from "./DB/connection.db.js";
import * as middleware from "./middleware/index.js";
import * as modules from "./modules/index.js";
// import configService from "../config/config.service.js";
import helmet from "helmet";

const app = express();
await BootstrapDB(app);

// CORS configuration allow only origins that are defined in the .env file, if the origin is not allowed, it will return an error with status 401.
// var corsOptions = {
//   origin: function (origin, callback) {
//     if (!configService.ORIGINS.includes(origin)) {
//       callback(
//         new Error("Not allowed by CORS", { cause: { status: 401 } }),
//         configService.ORIGINS,
//       );
//     } else {
//       callback(null, configService.ORIGINS);
//     }
//   },
// };

const limiterMiddleware = limiter.generateRateLimiter();

app.set("trust proxy", true);

app.use(
  helmet(),
  cors(),
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
