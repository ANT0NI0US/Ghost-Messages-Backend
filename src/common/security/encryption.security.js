import crypto from "node:crypto";
import { ENC_KEY, IV_LENGTH } from "../../../config/config.service.js";

// console.log(crypto.randomBytes(16).toString("hex"));

export const encrypt = async (plainText) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENC_KEY, iv);
  let encryptedData = cipher.update(plainText, "utf-8", "hex");
  encryptedData += cipher.final("hex");
  return `${iv.toString("hex")}:${encryptedData}`;
};

export const decrypt = async (encryptedData) => {
  const [iv, encryptedText] = encryptedData.split(":");

  const binaryLikeIv = Buffer.from(iv, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    ENC_KEY,
    binaryLikeIv,
  );

  let decryptedData = decipher.update(encryptedText, "hex", "utf8");
  decryptedData += decipher.final("utf-8");

  return decryptedData;
};
