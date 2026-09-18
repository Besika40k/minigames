import { defineConfig, type ConfigEnv, type UserConfig } from 'vite';

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const isDevelopment: boolean = mode === 'development';

  return {
    build: {
      sourcemap: isDevelopment,
      minify: !isDevelopment,
    },
  };
});
