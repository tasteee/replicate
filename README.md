# replicate

```
pnpm i -g @tasteee/replicate
```

Concatenate globbed files into a markdown snapshot, or reconstruct them from one.

## Commands

### `replicate up <path>`

Recursively scans `<path>` and writes every matched file into a single
markdown file with fenced code blocks.

**Output file:** `replicate-<timestamp>.md` by default.

```bash
replicate up ./src
replicate up ./src --output my-snapshot
replicate up ./src -o my-snapshot
```

#### Options

| Flag                         | Short | Description                               |
| ---------------------------- | ----- | ----------------------------------------- |
| `--output <name>`            | `-o`  | Output filename (without `.md`)           |
| `--extensions <exts...>`     | `-e`  | Only include files with these extensions  |
| `--not-extensions <exts...>` | `-ne` | Exclude files with these extensions       |
| `--ignore <patterns...>`     | `-i`  | Extra ignore patterns (added to defaults) |

```bash
# Only TypeScript & TSX
replicate up ./src -e ts tsx

# Everything except JSON and declaration files
replicate up ./src -ne json d.ts

# Add extra ignore patterns
replicate up . -i coverage storybook-static

# Combined
replicate up ./src -e ts tsx js -ne d.ts -o snapshot
```

#### Default ignores

replicate automatically ignores:

- `node_modules`, `.pnpm-store`, `.yarn`, `.npm`
- `dist`, `build`, `out`, `.next`, `.nuxt`, `.cache`, `coverage`
- Lock files (`*.lock`, `pnpm-lock.yaml`, `package-lock.json`, …)
- `.git`, `.idea`, `.vscode`
- `.env`, `.env.*`
- `*.map`, `*.d.ts`, `*.tsbuildinfo`, `*.log`

---

### `replicate down <path>`

Reads a replicate snapshot and reconstructs the original file tree starting
from the current directory (or `--dir`).

```bash
replicate down replicate-1234567890.md
replicate down replicate-1234567890.md --dir ./reconstructed
```

| Flag          | Short | Description                            |
| ------------- | ----- | -------------------------------------- |
| `--dir <dir>` | `-d`  | Output root directory (default: `cwd`) |

---

## Development

```bash
pnpm install
pnpm dev      # watch mode
pnpm build    # production build → dist/
```
