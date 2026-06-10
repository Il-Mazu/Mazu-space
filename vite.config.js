import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

function gitInfoPlugin() {
  const VIRTUAL_ID = 'virtual:git-info';
  const RESOLVED_ID = '\0' + VIRTUAL_ID;
  return {
    name: 'git-info',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        try {
          const log = execSync('git log --oneline -5', { encoding: 'utf-8' }).trim();
          const remoteRaw = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
          const buildDate = new Date().toISOString().split('T')[0];
          const commits = log.split('\n').filter(Boolean).map(line => {
            const i = line.indexOf(' ');
            return { hash: line.slice(0, i), message: line.slice(i + 1) };
          });
          return `
            export const commits = ${JSON.stringify(commits)};
            export const remote = ${JSON.stringify(remoteRaw)};
            export const buildDate = ${JSON.stringify(buildDate)};
          `;
        } catch (e) {
          return `
            export const commits = [];
            export const remote = '';
            export const buildDate = '';
          `;
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), gitInfoPlugin()],
  assetsInclude: ['**/*.gif', '**/*.mp3', '**/*.jpg'],
});
