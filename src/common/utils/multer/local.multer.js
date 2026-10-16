import { fileTypeFromBuffer } from "file-type";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import configService from "../../../../config/config.service.js";
import { exceptions } from "../../../common/index.js";

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

export const processFile = async ({
  customPath = "general",
  validation = [],
  file,
}) => {
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
