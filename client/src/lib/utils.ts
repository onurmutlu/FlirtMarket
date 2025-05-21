import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarUrl(name: string, size = 400) {
  const background = 'random';
  const color = 'fff';
  return `/api/avatar-proxy?name=${encodeURIComponent(name)}&background=${background}&color=${color}&size=${size}`;
}
