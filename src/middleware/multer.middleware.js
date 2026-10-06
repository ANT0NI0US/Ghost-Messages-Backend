import { BadRequestException } from "../common/exceptions/index.js";
import { multerUpload } from "../common/utils/index.js";

export const localMulterMiddleware = ({
  isRequired = true,
  customPath = "general",
  multerMiddleware,
  validation = [],
}) => {
  return async (req, res, next) => {
    multerMiddleware(req, res, async (error) => {
      try {
        if (error) {
          throw BadRequestException({ message: error.message });
        }
        if (
          isRequired &&
          !req.file &&
          !(Array.isArray(req.files) && req.files.length) &&
          !(typeof req.files == "object" && Object.keys(req.files).length)
        ) {
          throw BadRequestException({ message: "error.fileRequired" });
        }
        await multerUpload({ req, customPath, validation });
        next();
      } catch (error) {
        next(error);
      }
    });
  };
};
