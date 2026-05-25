import { Command } from "commander";
import fs from "node:fs/promises";
import path from "node:path";
import { collectFiles } from "../utils/collectFiles.js";
import { extToLang } from "../utils/extToLang.js";

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
  .action(
    async (
      targetPath: string,
      opts: {
        output?: string;
        extensions?: string[];
        notExtensions?: string[];
        ignore?: string[];
      },
    ) => {
      const rootDir = path.resolve(process.cwd(), targetPath);

      // Verify directory exists
      try {
        const stat = await fs.stat(rootDir);
        if (!stat.isDirectory()) {
          console.error(`Error: "${rootDir}" is not a directory.`);
          process.exit(1);
        }
      } catch {
        console.error(`Error: Directory "${rootDir}" does not exist.`);
        process.exit(1);
      }

      console.log(`\n📂  Scanning ${rootDir} …`);

      const files = await collectFiles(rootDir, {
        extensions: opts.extensions,
        notExtensions: opts.notExtensions,
        ignore: opts.ignore,
      });

      if (files.length === 0) {
        console.warn(
          "⚠️   No files matched the given criteria. Nothing to write.",
        );
        process.exit(0);
      }

      console.log(`📄  Found ${files.length} file(s). Building markdown …`);

      const sections: string[] = [];

      // Header
      const timestamp = new Date().toISOString();
      sections.push(`# replicate snapshot\n`);
      sections.push(`> Generated: ${timestamp}  \n> Source: \`${rootDir}\`\n`);
      sections.push(`---\n`);

      // Table of contents
      sections.push(`## Table of Contents\n`);
      for (const file of files) {
        const rel = path.relative(rootDir, file);
        // Create a GitHub-style anchor: lowercase, spaces→-, strip special chars
        const anchor = rel
          .toLowerCase()
          .replace(/[^a-z0-9\-_./ ]/g, "")
          .replace(/[\s/]+/g, "-");
        sections.push(`- [\`${rel}\`](#${anchor})`);
      }
      sections.push("\n---\n");

      // File contents
      for (const file of files) {
        const rel = path.relative(rootDir, file);
        const ext = path.extname(file);
        const lang = extToLang(ext);
        const anchor = rel
          .toLowerCase()
          .replace(/[^a-z0-9\-_./ ]/g, "")
          .replace(/[\s/]+/g, "-");

        let content: string;
        try {
          content = await fs.readFile(file, "utf8");
        } catch (err) {
          console.warn(
            `  ⚠️  Skipping ${rel} — could not read file: ${(err as Error).message}`,
          );
          continue;
        }

        sections.push(`## \`${rel}\` {#${anchor}}\n`);
        sections.push(`\`\`\`${lang}\n${content}\n\`\`\`\n`);
      }

      // Determine output path
      const outputName = opts.output
        ? opts.output.replace(/\.md$/i, "")
        : `replicate-${Date.now()}`;

      const outputPath = path.resolve(process.cwd(), `${outputName}.md`);

      await fs.writeFile(outputPath, sections.join("\n"), "utf8");

      console.log(`\n✅  Written to: ${outputPath}`);
      console.log(`    Files included : ${files.length}`);
    },
  );
