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
    case "bcrypt":
      const salt = (await bcrypt.genSalt(rounds, minor)).toString();
      cipherText = await bcrypt.hash(plainText, salt);
      break;
    case "argon2":
      cipherText = await argon2.hash(plainText);
      break;
    default:
      break;
  }

  return cipherText;
};

export const compare = async (plainText, cipherText, approach = "bcrypt") => {
  let match = "";

  switch (approach) {
    case "bcrypt":
      match = await bcrypt.compare(plainText, cipherText);
      break;
    case "argon2":
      match = await argon2.verify(cipherText, plainText);
      break;
    default:
      break;
  }

  return match;
};
