import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Parses a replicate markdown snapshot and returns an array of
 * { filePath, content } objects ready to be written to disk.
 */
interface ParsedFile {
  filePath: string;
  content: string;
}

function parseSnapshot(markdown: string): ParsedFile[] {
  const results: ParsedFile[] = [];

  // Each file section starts with a heading like:
  //   ## `path/to/file.ts` {#anchor}
  // followed immediately by a fenced code block.
  //
  // We look for that pattern using a regex.
  const sectionRegex =
    /^##\s+`([^`]+)`(?:\s+\{#[^}]+\})?\s*\n+```[^\n]*\n([\s\S]*?)```/gm;

  let match: RegExpExecArray | null;
  while ((match = sectionRegex.exec(markdown)) !== null) {
    const [, filePath, rawContent] = match;
    // rawContent ends with a trailing newline before the closing fence — trim it
    results.push({ filePath, content: rawContent.replace(/\n$/, "") });
  }

  return results;
}

export const downCommand = new Command("down")
  .description(
    "Reconstruct the original file structure from a replicate markdown snapshot",
  )
  .argument("<path>", "Path to the replicate snapshot .md file")
  .option(
    "-d, --dir <dir>",
    "Output root directory (defaults to current working directory)",
  )
  .action(async (snapshotPath: string, opts: { dir?: string }) => {
    const resolved = path.resolve(process.cwd(), snapshotPath);

    // Verify file exists
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isFile()) {
        console.error(`Error: "${resolved}" is not a file.`);
        process.exit(1);
      }
    } catch {
      console.error(`Error: File "${resolved}" does not exist.`);
      process.exit(1);
    }

    const markdown = await fs.readFile(resolved, "utf8");

    const files = parseSnapshot(markdown);

    if (files.length === 0) {
      console.error(
        "⚠️   No file sections found in the snapshot.\n" +
          "    Make sure you're pointing at a valid replicate snapshot created with `replicate up`.",
      );
      process.exit(1);
    }

    const outRoot = opts.dir
      ? path.resolve(process.cwd(), opts.dir)
      : process.cwd();

    console.log(
      `\n📦  Reconstructing ${files.length} file(s) into: ${outRoot}\n`,
    );

    let written = 0;
    let skipped = 0;

    for (const { filePath, content } of files) {
      // Normalise the path and prevent path traversal
      const normalised = path.normalize(filePath);
      if (normalised.startsWith("..")) {
        console.warn(`  ⚠️  Skipping "${filePath}" — path traversal detected.`);
        skipped++;
        continue;
      }

      const destPath = path.join(outRoot, normalised);
      const destDir = path.dirname(destPath);

      try {
        await fs.mkdir(destDir, { recursive: true });
        await fs.writeFile(destPath, content + "\n", "utf8");
        console.log(`  ✅  ${normalised}`);
        written++;
      } catch (err) {
        console.error(
          `  ❌  Failed to write "${normalised}": ${(err as Error).message}`,
        );
        skipped++;
      }
    }

    console.log(`\n✨  Done. ${written} file(s) written, ${skipped} skipped.`);
  });
