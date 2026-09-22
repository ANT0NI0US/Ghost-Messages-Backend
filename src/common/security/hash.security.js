import bcrypt from "bcrypt";
import argon2 from "argon2";

export const hash = async ({
  plainText,
  rounds = 12,
  minor = "b",
  approach = "bcrypt",
} = {}) => {
  let cipherText = "";

  switch (approach) {
    case "argon2":
      cipherText = await argon2.hash(plainText);
      break;
    default:
      const salt = (await bcrypt.genSalt(rounds, minor)).toString();
      cipherText = await bcrypt.hash(plainText, salt);
      break;
  }

  return cipherText;
};

export const compare = async (plainText, cipherText, approach = "bcrypt") => {
  let match = "";

  switch (approach) {
    case "argon2":
      match = await argon2.verify(cipherText, plainText);
      break;
    default:
      match = await bcrypt.compare(plainText, cipherText);
      break;
  }

  return match;
};
