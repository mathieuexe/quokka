import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(rawPassword: string): Promise<string> {
  return bcrypt.hash(rawPassword, ROUNDS);
}

export async function comparePassword(rawPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(rawPassword, hash);
}
