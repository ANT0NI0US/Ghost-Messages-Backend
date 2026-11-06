import { fileTypeFromBuffer } from "file-type";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import configService from "../../../../config/config.service.js";
import { exceptions } from "../../index.js";

export const fileValidation = {
  image: ["image/jpg", "image/jpeg", "image/png"],
  files: ["application/json", "application/pdf"],
};

export const processFile = async ({
  customPath = "general",
  validation = [],
  file,
}) => {
  if (file.path) {
    file.buffer = await readFile(file.path);
  }
  const result = await fileTypeFromBuffer(file.buffer);

  if (!result || !validation.includes(result.mime)) {
    if (file.path) {
      await unlink(file.path);
    }
    throw exceptions.BadRequestException({
      message: "error.invalidFileFormat",
    });
  }

  const customFolderPath = resolve(`./assets/${customPath}`);
  await mkdir(customFolderPath, { recursive: true });

  const uniqueFilePath = `assets/${customPath}/${randomUUID()}.${result.ext}`;

  const filePath = resolve(`./${uniqueFilePath}`);
  await writeFile(filePath, file.buffer);
  if (file.path) {
    await unlink(file.path);
  }
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

export const deleteLocalFile = async ({ url }) => {
  if (!url?.startsWith(configService.WEBSITE_URL)) {
    return;
  }

  const relativePath = url.slice(configService.WEBSITE_URL.length);

  try {
    await unlink(resolve(`./${relativePath}`));
  } catch (error) {
    console.error("Error while deleting file:", relativePath, error);
  }
};
