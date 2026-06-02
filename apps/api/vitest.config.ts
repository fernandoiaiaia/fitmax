import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@config': path.resolve(__dirname, './src/config'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@middlewares': path.resolve(__dirname, './src/middlewares'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@jobs': path.resolve(__dirname, './src/jobs'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
});
