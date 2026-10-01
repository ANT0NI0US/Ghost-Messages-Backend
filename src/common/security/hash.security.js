import bcrypt from "bcrypt";
import argon2 from "argon2";
import { HashEnum } from "../enum/index.js";
import { SALT_ROUND } from "../../../config/config.service.js";

export const hash = async ({
  plainText,
  rounds = SALT_ROUND,
  minor = "b",
  approach = HashEnum.BCRYPT,
} = {}) => {
  let cipherText = "";

  switch (approach) {
    case HashEnum.ARGON:
      cipherText = await argon2.hash(plainText);
      break;
    default:
      const salt = (await bcrypt.genSalt(rounds, minor)).toString();
      cipherText = await bcrypt.hash(plainText, salt);
      break;
  }

  return cipherText;
};

export const compare = async (
  plainText,
  cipherText,
  approach = HashEnum.BCRYPT,
) => {
  let match = "";

  switch (approach) {
    case HashEnum.ARGON:
      match = await argon2.verify(cipherText, plainText);
      break;
    default:
      match = await bcrypt.compare(plainText, cipherText);
      break;
  }

  return match;
};
