import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const HASH_KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, HASH_KEY_LENGTH)) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, savedHash] = storedHash.split(":");

  if (!salt || !savedHash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, HASH_KEY_LENGTH)) as Buffer;
  const savedHashBuffer = Buffer.from(savedHash, "hex");

  if (savedHashBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(savedHashBuffer, derivedKey);
}
