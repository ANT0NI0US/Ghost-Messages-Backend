import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../../../config/config.service.js";

export const generateToken = ({
  payload,
  secret = JWT_SECRET,
  expiresIn = JWT_EXPIRES_IN,
} = {}) => {
  return jwt.sign(payload, secret, { expiresIn });
};
