import { writeFile } from "node:fs/promises";
import { format, resolveConfig } from "prettier";

/**
 * Save the file after transforming with prettier.
 */
export async function writeFileWithFormatting(
  path: string,
  data: string,
): Promise<void> {
  const options = await resolveConfig(path);

  await writeFile(
    path,
    await format(data, {
      ...options,
      filepath: path,
    }),
  );
}
