import { fileTypeFromBuffer, fileTypeFromFile } from "file-type";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { exceptions } from "../../../common/index.js";
import configService from "../../../../config/config.service.js";

export const fileValidation = {
  image: ["image/jpg", "image/jpeg", "image/png"],
  files: ["application/json", "application.pdf"],
};

export const memoryFileUpload = ({ maxFileSize = 5 } = {}) => {
  const storage = multer.memoryStorage();

  return multer({
    storage,
    limits: { fileSize: maxFileSize * 1024 * 1024 },
  });
};

// this why we didn't use it ? cause in some reasons some users can change the extension for any file and we can't know that so we use multer.memoryStorage(); this is return a buffer so it gives us the ability to use the npm i file-type that can check the real file extension even if the user change it.
export const localFileUpload = ({ maxFileSize = 5 } = {}) => {
  const storage = multer.diskStorage({
    // where i will store the files.
    destination: async function (req, file, cb) {
      // if i leave the cb(null, "./assets") here as a string the folder if not exist will not be created so i will use the resolve to create the folder if not exist.

      const folderPath = resolve("./assets");
      await mkdir(folderPath, { recursive: true });
      cb(null, folderPath);
    },

    // filename for every file and i add randomUUID to accept files if it has the same name
    filename: function (req, file, cb) {
      cb(null, randomUUID() + "__" + file.originalname);
    },
  });

  /*
    ? filter the excitons that i will accept you must pass the validation array.
  * 1)
  async function fileFilter(req, file, cb) {
    if (validation.includes(file.mimetype)) {
      cb(new Error("Invalid file format", { cause: { status: 400 } }), false);
    } else {
      cb(null, true);
    }
  }

  * 2)
  if (file.mimetype != "image/jpeg" && file.mimetype != "image/jpg") {
        cb(new Error("Invalid file format", { cause: { status: 400 } }), false);
    } else {
        cb(null, true);
    }
  }
  */

  return multer({
    // fileFilter,
    storage,
    limits: { fileSize: maxFileSize * 1024 * 1024 },
  });
};

// using with only one file
// export const processFile = ({ validation = [] }) => {
//   return async (req, res, next) => {
//     const result = await fileTypeFromBuffer(req.file.buffer);
//     console.log({ result });

//     if (!result || !validation.includes(result.mime)) {
//       throw exceptions.BadRequestException({ message: "Invalid file format" });
//     }
//     const filePath = resolve(`./assets/${randomUUID()}.${result.ext}`);
//     await writeFile(filePath, req.file.buffer);
//     next();
//   };
// };

export const processFile = async ({
  customPath = "general",
  validation = [],
  file,
}) => {
  /*
   ? this is when i use multer.diskStorage() and i will get the file path and i will read it as a buffer to check the real file
   * 1)
      const bufferFile = readFile(resolve(req.file.path));
      const result = await fileTypeFromBuffer(bufferFile);
   * 2)
      const result = await fileTypeFromFile(req.file.path);
  */

  // if you use multer.memoryStorage() you will get the file as a buffer and you can use the file-type package to check the real file type even if the user changed the extension.
  const result = await fileTypeFromBuffer(file.buffer);

  if (!result || !validation.includes(result.mime)) {
    throw exceptions.BadRequestException({
      message: "error.invalidFileFormat",
    });
  }

  const customFolderPath = resolve(`./assets/${customPath}`);
  await mkdir(customFolderPath, { recursive: true });

  const uniqueFilePath = `assets/${customPath}/${randomUUID()}.${result.ext}`;

  const filePath = resolve(`./${uniqueFilePath}`);
  await writeFile(filePath, file.buffer);

  file.path = `${configService.WEBSITE_URL}${uniqueFilePath}`;

  return file;
};

export const processArrayFiles = async ({
  customPath,
  validation = [],
  files = [],
}) => {
  const uploadedFiles = [];
  for (const file of files) {
    const uploadFile = await processFile({ customPath, validation, file });
    uploadedFiles.push(uploadFile);
  }
  return uploadedFiles;
};

export const processFields = async ({
  customPath,
  validation = [],
  fields,
}) => {
  const assets = [];

  for (const field of Object.keys(fields)) {
    const uploadedFiles = await processArrayFiles({
      customPath,
      validation,
      files: fields[field],
    });
    assets.push({ key: field, uploadedFiles });
  }

  return assets;
};

export const multerUpload = async ({
  req,
  customPath = "general",
  validation = [],
}) => {
  if (req.file) {
    await processFile({ customPath, validation, file: req.file });
  } else if (Array.isArray(req.files) && req.files.length > 0) {
    await processArrayFiles({ customPath, validation, files: req.files });
  } else if (
    typeof req.files == "object" &&
    Object.keys(req.files)?.length > 0
  ) {
    await processFields({ customPath, validation, fields: req.files });
  }
};

// export const multerUpload = ({customPath = "general", validation = [] }) => {
//   return async (req, res, next) => {
//     if (req.file) {
//       await processFile({ customPath, validation, file: req.file });
//     } else if (Array.isArray(req.files)) {
//       await processArrayFiles({ customPath, validation, files: req.files });
//     } else if (typeof req.files == "object" && Object.keys(req.files)?.length) {
//       await processFields({ customPath, validation, fields: req.files });
//     }

//     next();
//   };
// };
