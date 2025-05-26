import { posix } from "node:path";

/**
 * Get all the non-leaf paths from a list of paths.
 */
export function getBreadcrumbs(paths: string[]): string[] {
  const breadcrumbs = paths.flatMap((path) => {
    const parents: string[] = [];

    let current = path;
    for (;;) {
      const next = posix.dirname(current);
      if (next === "/properties" || next === current) {
        break;
      }
      if (posix.basename(next) !== "*") {
        parents.push(next);
      }
      current = next;
    }
    return parents;
  });

  const unique = new Set(breadcrumbs);

  // delete any intermediate paths that are also leafs
  for (const path of paths) {
    unique.delete(path);
  }

  // sort the paths deepest first
  return [...unique].sort((a, b) => b.split("/").length - a.split("/").length);
}
