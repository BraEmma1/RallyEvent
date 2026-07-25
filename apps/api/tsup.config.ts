import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  // @rally/shared is a workspace source package (not published), so bundle it
  // in rather than leaving it as an unresolved runtime import.
  noExternal: ['@rally/shared'],
});
