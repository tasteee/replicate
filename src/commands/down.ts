import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import { describeError } from "../utils/describeError.js";

type ParsedFileT = {
  filePath: string;
  content: string;
};

type DownOptionsT = {
  dir?: string;
};

// Each file section starts with a heading like:
//   ## `path/to/file.ts`
// followed immediately by a 4-backtick fenced code block (4
// backticks so that files containing 3-backtick markdown blocks
// survive the round trip).
const SECTION_REGEX =
  /^##\s+`([^`]+)`(?:\s+\{#[^}]+\})?\s*\n+````[^\n]*\n([\s\S]*?)\n````/gm;

// Parse a replicate markdown snapshot into the files it describes.
// Any prose or extra markdown between sections is ignored, so the
// snapshot stays safe to hand-edit.
const parseSnapshot = (markdown: string): ParsedFileT[] => {
  const sectionMatches = markdown.matchAll(SECTION_REGEX);
  const parsedFiles: ParsedFileT[] = [];

  for (const sectionMatch of sectionMatches) {
    const filePath = sectionMatch[1];
    const rawContent = sectionMatch[2];
    // `up` writes the contents followed by a newline before the
    // closing fence, so drop that one trailing newline to restore
    // the file byte-for-byte.
    const content = rawContent.replace(/\n$/, "");
    parsedFiles.push({ filePath, content });
  }

  return parsedFiles;
};

const resolveOutputRoot = (outputDirectory?: string): string => {
  const hasOutputDirectory = outputDirectory !== undefined;
  if (hasOutputDirectory) return path.resolve(process.cwd(), outputDirectory);
  return process.cwd();
};

// Write a single reconstructed file, creating parent directories as
// needed. Returns null on success or an error message on failure.
const writeReconstructedFile = async (
  destinationPath: string,
  content: string,
): Promise<string | null> => {
  const destinationDirectory = path.dirname(destinationPath);
  await fs.mkdir(destinationDirectory, { recursive: true });
  await fs.writeFile(destinationPath, content + "\n", "utf8");
  return null;
};

export const downCommand = new Command("down")
  .description(
    "Reconstruct the original file structure from a replicate markdown snapshot",
  )
  .argument("<path>", "Path to the replicate snapshot .md file")
  .option(
    "-d, --dir <dir>",
    "Output root directory (defaults to current working directory)",
  )
  .action(async (snapshotPath: string, options: DownOptionsT) => {
    const resolvedSnapshotPath = path.resolve(process.cwd(), snapshotPath);

    const snapshotStats = await fs.stat(resolvedSnapshotPath).catch(() => {
      return null;
    });

    const isMissingFile = snapshotStats === null;
    if (isMissingFile) {
      console.error(`Error: File "${resolvedSnapshotPath}" does not exist.`);
      process.exit(1);
    }

    const isNotFile = !snapshotStats.isFile();
    if (isNotFile) {
      console.error(`Error: "${resolvedSnapshotPath}" is not a file.`);
      process.exit(1);
    }

    const markdown = await fs.readFile(resolvedSnapshotPath, "utf8");
    const files = parseSnapshot(markdown);

    const hasFiles = files.length > 0;
    if (!hasFiles) {
      console.error(
        "⚠️   No file sections found in the snapshot.\n" +
          "    Make sure you're pointing at a valid replicate snapshot created with `replicate up`.",
      );
      process.exit(1);
    }

    const outputRoot = resolveOutputRoot(options.dir);

    console.log(
      `\n📦  Reconstructing ${files.length} file(s) into: ${outputRoot}\n`,
    );

    let writtenCount = 0;
    let skippedCount = 0;

    for (const parsedFile of files) {
      // Normalise the path and prevent path traversal.
      const normalizedPath = path.normalize(parsedFile.filePath);
      const isTraversal = normalizedPath.startsWith("..");
      if (isTraversal) {
        console.warn(
          `  ⚠️  Skipping "${parsedFile.filePath}" — path traversal detected.`,
        );
        skippedCount++;
        continue;
      }

      const destinationPath = path.join(outputRoot, normalizedPath);
      const writeError = await writeReconstructedFile(
        destinationPath,
        parsedFile.content,
      ).catch(describeError);

      const didFail = writeError !== null;
      if (didFail) {
        console.error(`  ❌  Failed to write "${normalizedPath}": ${writeError}`);
        skippedCount++;
        continue;
      }

      console.log(`  ✅  ${normalizedPath}`);
      writtenCount++;
    }

    console.log(
      `\n✨  Done. ${writtenCount} file(s) written, ${skippedCount} skipped.`,
    );
  });
