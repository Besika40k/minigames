import type { ConfigEnv, UserConfig } from 'vite';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default defineConfig((configEnvironment: ConfigEnv): UserConfig =>
  mergeConfig(viteConfig(configEnvironment), {
    test: {
      // components and the router work with real DOM elements, history and storage
      environment: 'happy-dom',
      include: ['src/**/*.test.ts'],
      // every test starts with the real implementations, without stubs left by another test
      restoreMocks: true,
      unstubGlobals: true,
      coverage: {
        provider: 'v8',
        // the table also lists the files that are fully covered, so it shows every included file
        reporter: [['text', { skipFull: false }], 'html'],
        // every source file is reported, also the ones no test imports yet
        include: ['src/**/*.ts'],
        exclude: [
          // the tests themselves, not application code
          'src/**/*.test.ts',
          // bootstrap only: imports the global styles and calls startApp()
          'src/main.ts',
        ],
      },
    },
  }),
);
