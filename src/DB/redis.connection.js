import { createClient } from "redis";
import configService from "../../config/config.service.js";

export const client = createClient({
  url: configService.DB_REDIS_URI,
});

export async function connectRedis() {
  try {
    await client.connect();
    console.log(`Redis connection stablish successfully`);
  } catch (error) {
    console.log(`Failed to stablish Redis connection`);
  }
}
