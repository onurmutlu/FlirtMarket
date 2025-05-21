import { customAlphabet } from 'nanoid';

// Karışık olmayan, okunabilir karakterler
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const nanoid = customAlphabet(ALPHABET, 8);

export function generateReferralCode(): string {
  return nanoid();
} 