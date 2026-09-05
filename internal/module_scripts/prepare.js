#!/usr/bin/env node
const { spawnSyncWithAutoShell } = require('./util');
const fs = require('fs');
const path = require('path');

const SUBTARGETS = ['plugin', 'cli', 'utils', 'scripts'];

function run(cmd, args = []) {
  const result = spawnSyncWithAutoShell(cmd, args, { stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    if (result.error) console.error(result.error.message);
    process.exit(result.status ?? 1);
  }
}

// Clean and build main
fs.rmSync(path.join(process.cwd(), 'build'), { recursive: true, force: true });
run('tsc');

// Clean and build any existing subtargets
for (const target of SUBTARGETS) {
  const targetDir = path.join(process.cwd(), target);
  if (fs.existsSync(targetDir) && fs.existsSync(path.join(targetDir, 'tsconfig.json'))) {
    console.error(`Building ${target}`);
    fs.rmSync(path.join(targetDir, 'build'), { recursive: true, force: true });
    run('tsc', ['--build', targetDir]);
  }
}
