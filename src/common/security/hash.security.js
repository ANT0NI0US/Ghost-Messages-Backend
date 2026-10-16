import argon2 from "argon2";

export const hash = async ({ plainText } = {}) => {
  return await argon2.hash(plainText);
};

export const compare = async (plainText, cipherText) => {
  return await argon2.verify(cipherText, plainText);
};
