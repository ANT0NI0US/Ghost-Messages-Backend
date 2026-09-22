import { resolve } from "node:path";
import { config } from "dotenv";

export const NODE_ENV = process.env.NODE_ENV ?? "development";

config({ path: resolve(`./config/.env.${NODE_ENV}`) });

export const PORT = parseInt(process.env.PORT ?? "4000");

const DB_URL = process.env.DB_URL_LOCAL || process.env.DB_URL_ATLAS;
const DB_NAME = process.env.DB_NAME || "Ghost_Messages";
export const DB_URI = `${DB_URL}/${DB_NAME}`;

export const ENC_KEY = process.env.ENC_KEY;
export const IV_LENGTH = parseInt(process.env.IV_LENGTH ?? "16");

// ACCESS TOKEN (USER , ADMIN)
export const ACCESS_ADMIN_TOKEN_SIGNATURE =
  process.env.ACCESS_ADMIN_TOKEN_SIGNATURE;
export const ACCESS_USER_TOKEN_SIGNATURE =
  process.env.ACCESS_USER_TOKEN_SIGNATURE;
export const ACCESS_TOKEN_EXPIRES_IN = parseInt(
  process.env.ACCESS_TOKEN_EXPIRES_IN ?? "1800",
);

// REFRESH TOKEN (USER , ADMIN)
export const REFRESH_ADMIN_TOKEN_SIGNATURE =
  process.env.REFRESH_ADMIN_TOKEN_SIGNATURE;
export const REFRESH_USER_TOKEN_SIGNATURE =
  process.env.REFRESH_USER_TOKEN_SIGNATURE;
export const REFRESH_TOKEN_EXPIRES_IN = parseInt(
  process.env.REFRESH_TOKEN_EXPIRES_IN ?? "31536000",
);

// GOOGLE ACCOUNT
export const WEB_CLIENT_IDS = process.env.WEB_CLIENT_IDS.split(",");
