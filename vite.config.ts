import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { spawn } from 'node:child_process';
import path from 'node:path';

function themeWatcher(): Plugin {
  return {
    name: 'theme-watcher',
    configureServer(server) {
      const watchPaths = [
        path.resolve(__dirname, 'src/themes/definitions'),
        path.resolve(__dirname, 'src/themes/variants'),
      ];

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;

      const regenerate = () => {
        console.log('\n[theme] Token change detected, regenerating CSS...');
        const proc = spawn('npx', ['tsx', 'scripts/generate-theme.ts'], {
          stdio: 'inherit',
          shell: true,
        });
        proc.on('close', (code) => {
          if (code === 0) {
            console.log('[theme] CSS regenerated\n');
          }
        });
      };

      server.watcher.add(watchPaths);
      server.watcher.on('change', (file) => {
        const isThemeFile =
          file.includes('src/themes/definitions') || file.includes('src/themes/variants');
        if (isThemeFile && file.endsWith('.ts')) {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(regenerate, 100);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [svelte(), themeWatcher()],
});
