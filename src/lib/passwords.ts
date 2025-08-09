import CryptoJS from 'crypto-js';

// Single source of truth for password hashing across the app
export const PASSWORD_SALT = 'salt_pbr_2024';

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + PASSWORD_SALT).toString();
}

export function verifyPassword(plain: string, hashed: string): boolean {
  try {
    return hashPassword(plain) === hashed;
  } catch {
    return false;
  }
}

export function generateTempPassword(length: number = 12): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return pwd;
}



