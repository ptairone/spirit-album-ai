import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertGoogleDriveLink(driveLink: string): string {
  // Extract file ID from various Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,  // /file/d/FILE_ID
    /id=([a-zA-Z0-9_-]+)/,           // ?id=FILE_ID
    /\/d\/([a-zA-Z0-9_-]+)/,         // /d/FILE_ID
  ];

  for (const pattern of patterns) {
    const match = driveLink.match(pattern);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }

  // If no pattern matches, return original link
  return driveLink;
}
