import { exceptions, localMulter } from "../common/index.js";

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
          throw exceptions.BadRequestException({ message: error.message });
        }
        if (
          isRequired &&
          !req.file &&
          !(Array.isArray(req.files) && req.files.length > 0) &&
          !(typeof req.files == "object" && Object.keys(req.files).length > 0)
        ) {
          throw exceptions.BadRequestException({
            message: "error.fileRequired",
          });
        }
        await localMulter.multerUpload({ req, customPath, validation });
        next();
      } catch (error) {
        next(error);
      }
    });
  };
};
