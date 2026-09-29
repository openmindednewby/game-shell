import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    target: 'es2020',
    outDir: 'dist',
  },
  {
    entry: { 'game-shell': 'src/index.ts' },
    format: ['iife'],
    globalName: 'GameShell',
    outExtension: () => ({ js: '.iife.js' }),
    minify: true,
    sourcemap: true,
    clean: false,
    target: 'es2018',
    outDir: 'dist',
  },
]);
