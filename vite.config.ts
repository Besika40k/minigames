import { defineConfig, type ConfigEnv, type UserConfig } from 'vite';

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const isDevelopment: boolean = mode === 'development';

  return {
    css: {
      preprocessorOptions: {
        scss: {
          // lets any .scss file write `@use 'abstracts'` instead of a relative path
          loadPaths: ['src/styles'],
        },
      },
    },
    build: {
      sourcemap: isDevelopment,
      minify: !isDevelopment,
    },
  };
});
