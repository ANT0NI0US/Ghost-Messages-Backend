import argon2 from "argon2";

export const hash = async ({ plainText } = {}) => {
  if (typeof plainText !== "string") {
    plainText = String(plainText);
  }
  return await argon2.hash(plainText);
};

export const compare = async (plainText, cipherText) => {
  return await argon2.verify(cipherText, plainText);
};
