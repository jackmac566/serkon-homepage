import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repository = path.resolve(project, '..');
const source = path.join(repository, 'public');
const destination = path.join(project, 'public', 'assets');
const assets = {
  'portrait.jpg': 'serkon-hero.jpg',
  'call.jpg': 'serkon-moment-call.jpg',
  'wave.jpg': 'serkon-moment-wave.jpg',
  'polaroids.webp': 'archive/polaroid-collage.webp',
  'color.webp': 'work-color-system.webp',
  'london.webp': 'archive/london-ai-workspace.webp',
  'export.webp': 'archive/london-video-export.webp',
  'genesis.webp': 'archive/genesis-music-release.webp',
  'first-build.webp': 'archive/serkon-first-build.webp',
  'genesis.mp3': 'creation-fk.mp3',
};

// Fail clearly before writing an incomplete asset set or replacing a good build.
for (const relative of Object.values(assets)) {
  const file = path.join(source, relative);
  if (!(await stat(file)).isFile()) throw new Error(`Missing source asset: ${file}`);
}
await mkdir(destination, { recursive: true });
await Promise.all(Object.entries(assets).map(([name, relative]) =>
  copyFile(path.join(source, relative), path.join(destination, name))));

await build({
  configFile: false,
  root: project,
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 0,
  },
});

for (const relative of ['index.html', '_worker.js', '_routes.json', 'assets/genesis.mp3']) {
  await stat(path.join(project, 'dist', relative));
}
console.log('World build ready: world/dist (independent preview, no database binding).');
