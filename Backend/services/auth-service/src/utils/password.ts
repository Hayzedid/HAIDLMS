import bcrypt from 'bcryptjs';

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, ROUNDS);

export const comparePassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

export const isStrongPassword = (password: string): boolean => {
  // Min 12 chars, upper, lower, number, special char (per SRS 6.1)
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;
  return regex.test(password);
};
