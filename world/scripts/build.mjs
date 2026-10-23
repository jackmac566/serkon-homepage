import { copyFile, mkdir, stat, cp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
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

const explorer = path.join(project, 'explorer');
const explorerAssets = path.join(explorer, 'static', 'assets');
await mkdir(explorerAssets, { recursive: true });
await Promise.all(Object.keys(assets).map(name => copyFile(path.join(destination, name), path.join(explorerAssets, name))));
await cp(path.join(explorer, 'serkon-assets'), explorerAssets, { recursive: true });
await copyFile(path.join(explorer, 'license.md'), path.join(explorer, 'static', 'license.md'));
await copyFile(path.join(explorer, 'UPSTREAM.md'), path.join(explorer, 'static', 'UPSTREAM.md'));
execFileSync(process.execPath, [path.join(explorer, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--mode', 'serkon'], { cwd: explorer, stdio: 'inherit' });

const studio = path.join(project, 'studio');
await copyFile(path.join(studio, 'UPSTREAM.md'), path.join(studio, 'static', 'UPSTREAM.md'));
await copyFile(path.join(studio, 'LICENSE.md'), path.join(studio, 'static', 'LICENSE.md'));
execFileSync(process.execPath, [path.join(studio, 'node_modules', 'webpack', 'bin', 'webpack.js'), '--config', './bundler/webpack.prod.js'], { cwd: studio, stdio: 'inherit' });

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

await cp(path.join(explorer, 'dist'), path.join(project, 'dist', 'explorer'), { recursive: true });

await cp(path.join(studio, 'dist'), path.join(project, 'dist', 'studio'), { recursive: true });
await cp(path.join(project, 'desktop'), path.join(project, 'dist', 'desktop'), { recursive: true });

for (const relative of ['index.html', '_worker.js', '_routes.json', 'assets/genesis.mp3']) {
  await stat(path.join(project, 'dist', relative));
}
console.log('World build ready: world/dist (independent preview, no database binding).');
