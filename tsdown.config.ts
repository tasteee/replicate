import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  dts: false,
  treeshake: true,
  target: 'node18',
  banner: {
    js: '#!/usr/bin/env node',
  },
})
