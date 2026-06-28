import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "../utils/collectFiles.js";
import { extensionToLanguage } from "../utils/extToLang.js";
import { describeError } from "../utils/describeError.js";

type UpOptionsT = {
  output?: string;
  extensions?: string[];
  notExtensions?: string[];
  ignore?: string[];
};

// Build the markdown for a single file: a heading naming the file
// followed by its contents in a 4-backtick fenced block. Four
// backticks let files that themselves contain 3-backtick markdown
// code blocks survive without breaking the surrounding snapshot.
const buildFileSection = (
  relativePath: string,
  language: string,
  content: string,
): string => {
  const heading = `## \`${relativePath}\`\n`;
  const fencedContent = `\`\`\`\`${language}\n${content}\n\`\`\`\`\n`;
  return `${heading}\n${fencedContent}`;
};

const resolveOutputPath = (output?: string): string => {
  const hasOutputName = output !== undefined;
  const outputName = hasOutputName
    ? output.replace(/\.md$/i, "")
    : `replicate-${Date.now()}`;
  return path.resolve(process.cwd(), `${outputName}.md`);
};

export const upCommand = new Command("up")
  .description("Concatenate files under <path> into a single markdown snapshot")
  .argument("<path>", "Root directory to scan")
  .option(
    "-o, --output <name>",
    "Output filename without extension (default: replicate-<timestamp>)",
  )
  .option(
    "-e, --extensions <exts...>",
    "Only include files with these extensions (e.g. ts js tsx)",
  )
  .option(
    "-ne, --not-extensions <exts...>",
    "Exclude files with these extensions (e.g. json d.ts)",
  )
  .option(
    "-i, --ignore <patterns...>",
    "Additional ignore patterns (added to defaults)",
  )
  .action(async (targetPath: string, options: UpOptionsT) => {
    const rootDir = path.resolve(process.cwd(), targetPath);

    const directoryStats = await fs.stat(rootDir).catch(() => {
      return null;
    });

    const isMissingDirectory = directoryStats === null;
    if (isMissingDirectory) {
      console.error(`Error: Directory "${rootDir}" does not exist.`);
      process.exit(1);
    }

    const isNotDirectory = !directoryStats.isDirectory();
    if (isNotDirectory) {
      console.error(`Error: "${rootDir}" is not a directory.`);
      process.exit(1);
    }

    console.log(`\n📂  Scanning ${rootDir} …`);

    const files = await collectFiles(rootDir, {
      extensions: options.extensions,
      notExtensions: options.notExtensions,
      ignore: options.ignore,
    });

    const hasFiles = files.length > 0;
    if (!hasFiles) {
      console.warn("⚠️   No files matched the given criteria. Nothing to write.");
      process.exit(0);
    }

    console.log(`📄  Found ${files.length} file(s). Building markdown …`);

    // File contents only — no header, TOC, or other metadata. Each
    // section is just a heading naming the file (so `down` knows where
    // to put it back) followed by the file's contents.
    const sections: string[] = [];

    for (const file of files) {
      const relativePath = path.relative(rootDir, file);
      const fileExtension = path.extname(file);
      const language = extensionToLanguage(fileExtension);

      const content = await fs.readFile(file, "utf8").catch((thrown) => {
        const reason = describeError(thrown);
        console.warn(`  ⚠️  Skipping ${relativePath} — could not read file: ${reason}`);
        return null;
      });

      const couldNotRead = content === null;
      if (couldNotRead) continue;

      sections.push(buildFileSection(relativePath, language, content));
    }

    const outputPath = resolveOutputPath(options.output);

    await fs.writeFile(outputPath, sections.join("\n"), "utf8");

    console.log(`\n✅  Written to: ${outputPath}`);
    console.log(`    Files included : ${files.length}`);
  });
