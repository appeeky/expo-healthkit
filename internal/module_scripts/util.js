const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function resolveBin(command) {
  const local = path.join(process.cwd(), 'node_modules', '.bin', command);
  if (fs.existsSync(local) || fs.existsSync(`${local}.cmd`)) {
    return local;
  }
  return command;
}

// On Windows, executables like `tsc` and `jest` are `.cmd` batch files and cannot be
// spawned directly — they require shell: true to resolve. On Unix, shell: true is
// unnecessary.
function spawnSyncWithAutoShell(command, args, options) {
  return spawnSync(resolveBin(command), args, {
    ...options,
    shell: process.platform === 'win32',
  });
}

function exitFromSpawn(result) {
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

module.exports = { spawnSyncWithAutoShell, exitFromSpawn };
