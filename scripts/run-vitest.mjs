import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startVitest } from 'vitest/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const cliFilters = process.argv.slice(2);

await startVitest(
  'test',
  cliFilters,
  {
    root,
    run: true,
    watch: false,
    config: false,
  },
  {
    resolve: {
      alias: {
        '@': path.resolve(root, 'src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      css: false,
      pool: 'threads',
    },
  }
);
