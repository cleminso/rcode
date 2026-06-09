import {
  adjectives,
  animals,
  type Config,
  uniqueNamesGenerator,
} from "unique-names-generator";

const config: Config = {
  dictionaries: [adjectives, animals],
  separator: "-",
  length: 2,
};

export function generateUniqueName() {
  return uniqueNamesGenerator(config);
}

export const baseColors = [
  "red",
  "orange",
  "green",
  "blue",
  "purple",
  "pink",
] as const;

export type BaseColor = (typeof baseColors)[number];

export interface ColorDetails {
  name: BaseColor;
  avatarBg: string;
  cursor: string;
  cursorSelection: string;
}

export const colors: Record<BaseColor, ColorDetails> = {
  red: {
    name: "red",
    avatarBg: "bg-red-600",
    cursor: "oklch(0.637 0.237 25.331)",
    cursorSelection: "oklch(0.637 0.237 25.331 / 18%)",
  },
  orange: {
    name: "orange",
    avatarBg: "bg-orange-600",
    cursor: "oklch(0.666 0.179 58.318)",
    cursorSelection: "oklch(0.666 0.179 58.318 / 18%)",
  },
  green: {
    name: "green",
    avatarBg: "bg-green-600",
    cursor: "oklch(0.596 0.145 163.225)",
    cursorSelection: "oklch(0.596 0.145 163.225 / 18%)",
  },
  blue: {
    name: "blue",
    avatarBg: "bg-blue-600",
    cursor: "oklch(0.623 0.214 259.815)",
    cursorSelection: "oklch(0.623 0.214 259.815 / 18%)",
  },
  purple: {
    name: "purple",
    avatarBg: "bg-purple-600",
    cursor: "oklch(0.606 0.25 292.717)",
    cursorSelection: "oklch(0.606 0.25 292.717 / 18%)",
  },
  pink: {
    name: "pink",
    avatarBg: "bg-pink-600",
    cursor: "oklch(0.645 0.246 16.439)",
    cursorSelection: "oklch(0.645 0.246 16.439 / 18%)",
  },
};

/**
 * Assigns an option to a new user based on the least number of existing assignments.
 * If multiple options have the same minimum count, one is selected randomly.
 */
export function assignOption<T>(availableOptions: T[], existingOptions: T[]): T {
  if (availableOptions.length === 0) {
    throw new Error("No available options to assign.");
  }

  const optionCounts = new Map<T, number>();

  for (const option of availableOptions) {
    optionCounts.set(option, 0);
  }

  for (const option of existingOptions) {
    if (optionCounts.has(option)) {
      optionCounts.set(option, (optionCounts.get(option) ?? 0) + 1);
    }
  }

  let minCount = Number.POSITIVE_INFINITY;
  for (const count of optionCounts.values()) {
    if (count < minCount) {
      minCount = count;
    }
  }

  const leastAssignedOptions: T[] = [];
  for (const [option, count] of optionCounts.entries()) {
    if (count === minCount) {
      leastAssignedOptions.push(option);
    }
  }

  const randomIndex = Math.floor(Math.random() * leastAssignedOptions.length);
  return leastAssignedOptions[randomIndex]!;
}
