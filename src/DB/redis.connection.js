import { createClient } from "redis";
import { DB_REDIS_URI } from "../../config/config.service.js";

export const client = createClient({
  url: DB_REDIS_URI,
});

export async function connectRedis() {
  try {
    await client.connect();
    console.log(`Redis connection stablish successfully`);
  } catch (error) {
    console.log(`Failed to stablish Redis connection`);
  }
}
