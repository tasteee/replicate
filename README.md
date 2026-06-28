# replicate

A tiny CLI that folds an entire folder into one tidy markdown file — and unfolds it right back into the original file tree.

```bash
pnpm i -g @tasteee/replicate
```

```bash
replicate up ./src        # folder  → one markdown snapshot
replicate down snap.md    # snapshot → folder
```

That's the whole idea. `up` packs, `down` unpacks, and a round trip gives you back exactly what you started with — byte for byte.

## Why?

Sometimes you just need a whole codebase as a single, readable, pasteable thing:

- **Hand a project to an LLM** without zipping, uploading, or clicking through a file picker.
- **Share or review code** in a single scrollable document, with every file fenced and syntax-highlighted.
- **Snapshot a folder** into one file you can drop in a gist, an issue, or a chat.
- **Reconstruct it later** — `down` rebuilds the tree wherever you point it.

No config, no project files, nothing to set up. Point it at a folder and go.

## Quick start

Pack a folder into a snapshot:

```bash
replicate up ./src
# ✅  Written to: replicate-1719600000000.md
```

You'll get a markdown file where every source file is a section: a heading with its path, followed by its contents in a fenced code block.

````markdown
## `index.ts`

```ts
export const hello = () => 'world'
```

## `utils/math.ts`

```ts
export const add = (a: number, b: number) => a + b
```
````

Rebuild the tree from that snapshot whenever you like:

```bash
replicate down replicate-1719600000000.md
# 📦  Reconstructing 2 file(s)
#   ✅  index.ts
#   ✅  utils/math.ts
```

## `replicate up <path>`

Recursively scans `<path>` and writes every matched file into a single markdown snapshot. By default it writes to `replicate-<timestamp>.md` in your current directory.

```bash
replicate up ./src                       # everything under ./src
replicate up ./src -o my-snapshot        # → my-snapshot.md
replicate up ./src -e ts tsx             # only .ts and .tsx
replicate up ./src -ne json              # everything except .json
replicate up .   -i coverage .storybook  # add extra ignore patterns
```

| Flag                         | Short | Description                               |
| ---------------------------- | ----- | ----------------------------------------- |
| `--output <name>`            | `-o`  | Output filename (without `.md`)           |
| `--extensions <exts...>`     | `-e`  | Only include files with these extensions  |
| `--not-extensions <exts...>` | `-ne` | Exclude files with these extensions       |
| `--ignore <patterns...>`     | `-i`  | Extra ignore patterns (added to defaults) |

Flags compose, so you can be as precise as you want:

```bash
replicate up ./src -e ts tsx js -ne d.ts -o snapshot
```

### What it skips by default

So your snapshots stay focused on source, replicate ignores the usual noise out of the box:

- Dependencies — `node_modules`, `.pnpm-store`, `.yarn`, `.npm`
- Build output — `dist`, `build`, `out`, `.next`, `.nuxt`, `.cache`, `coverage`, …
- Lock files — `*.lock`, `pnpm-lock.yaml`, `package-lock.json`, …
- Tooling dirs — `.git`, `.idea`, `.vscode`
- Generated files — `*.map`, `*.tsbuildinfo`, `*.log`
- Secrets — `.env`, `.env.*`

Anything that could be source is kept — including hand-written `*.d.ts` declaration files. Need to drop a default? You can't remove built-ins, but `-e` / `-ne` let you narrow the set precisely.

## `replicate down <path>`

Reads a snapshot and reconstructs the original file tree, starting from the current directory (or wherever `--dir` points).

```bash
replicate down snap.md                  # rebuild into the current folder
replicate down snap.md -d ./restored    # rebuild into ./restored
```

| Flag          | Short | Description                            |
| ------------- | ----- | -------------------------------------- |
| `--dir <dir>` | `-d`  | Output root directory (default: `cwd`) |

`down` only cares about the file sections — a heading like `` ## `path/to/file.ts` `` followed by a fenced block. Everything else in the document is ignored, so you can **add notes, prose, or extra markdown anywhere** and it'll still rebuild cleanly. Paths that try to escape the output root (`../`) are skipped, not written.

## Two details that make it just work

**Markdown-safe fences.** Snapshots wrap every file in **four-backtick** fences. That means a file that is *itself* markdown with normal three-backtick code blocks nests perfectly — your snapshot never gets visually mangled.

**Lossless round trips.** `replicate up` then `replicate down` returns your files byte-for-byte. Pack it, share it, unpack it — same bytes out.

## Development

```bash
pnpm install
pnpm dev      # watch mode
pnpm build    # production build → dist/
```

## License

[MIT](LICENSE)
