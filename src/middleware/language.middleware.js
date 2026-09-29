import { LanguageEnum } from "../common/enum/index.js";

export const language = (req, res, next) => {
  const requested = Number(req.headers["accept-language"]);
  req.lang = Object.values(LanguageEnum).includes(requested)
    ? requested
    : LanguageEnum.EN;
  next();
};
