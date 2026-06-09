declare module "unique-names-generator" {
  export const adjectives: string[];
  export const animals: string[];
  export const colors: string[];
  export const countries: string[];
  export const names: string[];
  export const starWars: string[];

  export interface Config {
    dictionaries: string[][];
    separator?: string;
    length?: number;
    style?: "lowerCase" | "upperCase" | "capital";
  }

  export function uniqueNamesGenerator(config: Config): string;
}
