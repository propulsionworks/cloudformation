/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import assert from "node:assert";

type ArrayKeysOf<T> = {
  [K in keyof T]-?: any[] extends T[K] ? K : never;
}[keyof T];

/**
 * Merge objects together, only overwriting an existing value if the new value
 * is not undefined.
 */
export function assign<T extends object>(
  target: T,
  ...objects: T[]
): asserts target is T {
  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        (target as any)[key] = value;
      }
    }
  }
}

/**
 * Merge the objects using the supplied merge function for each value.
 */
export function mergeObjectsWith<T extends object>(
  objects: T[],
  mergeValues: <K extends keyof T>(a: T[K], b: T[K], key: K) => T[K],
): T {
  const first = objects.pop();
  assert(first, "expected non-empty array of objects");

  const result: any = { ...first };

  for (const object of objects) {
    for (const [key, value] of Object.entries(object)) {
      if (value === undefined) {
        continue;
      }
      if (result[key] === undefined) {
        result[key] = value;
      } else {
        result[key] = mergeValues(result[key], value, key as keyof T);
      }
    }
  }

  return result;
}

/**
 * Options for {@link mergeObjects}.
 */
export type MergeObjectsOptions<T extends object> = {
  mergeArrayValues?: boolean | ArrayKeysOf<T>[] | undefined;
  overwriteValues?: boolean | (keyof T)[] | undefined;
  uniqueArrayValues?: boolean | undefined;
};

/**
 * Result of {@link mergeObjects}.
 */
export type MergeObjectsResult<T> = {
  conflicts?: (keyof T)[];
  value: T;
};

/**
 * Merge objects by either overwriting or merging arrays.
 */
export function mergeObjects<T extends object>(
  objects: T[],
  options: MergeObjectsOptions<T> = {},
): MergeObjectsResult<T> {
  const { mergeArrayValues, overwriteValues, uniqueArrayValues } = options;
  const conflicts: (keyof T)[] = [];

  const value = mergeObjectsWith<T>(objects, (a, b, key): any => {
    const mergeArrays = Array.isArray(mergeArrayValues)
      ? mergeArrayValues.includes(key as string as ArrayKeysOf<T>)
      : mergeArrayValues && Array.isArray(a) && Array.isArray(b);

    if (mergeArrays) {
      let result: unknown[];
      if (Array.isArray(a)) {
        if (Array.isArray(b)) {
          result = [...a, ...b];
        } else {
          result = [...a, b];
        }
      } else if (Array.isArray(b)) {
        result = [a, ...b];
      } else {
        result = [a, b];
      }
      return uniqueArrayValues ? [...new Set(result)] : result;
    }
    if (
      overwriteValues === true ||
      (overwriteValues && overwriteValues.includes(key))
    ) {
      return b;
    }
    if (a !== b) {
      conflicts.push(key);
    }
    return a;
  });

  if (conflicts.length > 0) {
    return { value, conflicts };
  }
  return { value };
}

/**
 * Pick keys from object.
 */
export function pick<T extends object, K extends keyof T>(
  object: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    const value = object[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Pick some keys from an object and also return the remainder.
 */
export function splitPick<T extends object, K extends keyof T>(
  object: T,
  keys: readonly K[],
): [Pick<T, K>, Omit<T, K>] {
  const picked: any = {};
  const rest: any = {};

  for (const [key, value] of Object.entries(object)) {
    const target = keys.includes(key as K) ? picked : rest;
    target[key] = value;
  }

  return [picked, rest];
}
