import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getRandomIndexExcluding = <T>(array: T[], excludeIndex: number): number => {
  const length = array.length;

  if (length <= 1) return 0; // No hay opciones válidas
  if (excludeIndex < 0 || excludeIndex >= length) {
    // Si el índice excluido no es válido, devolvemos uno cualquiera
    return Math.floor(Math.random() * length);
  }

  let index: number;
  do {
    index = Math.floor(Math.random() * length);
  } while (index === excludeIndex);

  return index;
};
