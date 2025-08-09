// Push .env variables to Vercel (production) non-interactively
// Usage: node scripts/push-vercel-env.js

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ENV_PATH = path.join(process.cwd(), '.env');

function parseDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`.env not found at ${filePath}`);
    process.exit(1);
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    // Support quoted values
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

async function runVercelEnvAdd(key, value, target = 'production') {
  return new Promise((resolve) => {
    // Try vercel, fall back to npx vercel if not on PATH
    let proc = spawn('vercel', ['env', 'add', key, target], { stdio: ['pipe', 'inherit', 'inherit'] });
    let finished = false;

    proc.on('error', (err) => {
      if (err.code === 'ENOENT') {
        // Retry with npx vercel
        proc = spawn('npx', ['vercel', 'env', 'add', key, target], { stdio: ['pipe', 'inherit', 'inherit'] });
        bindHandlers(proc);
      } else {
        if (!finished) {
          finished = true;
          console.error(`Failed to run vercel env add for ${key}:`, err.message);
          resolve(false);
        }
      }
    });

    function bindHandlers(child) {
      child.on('exit', (code) => {
        if (!finished) {
          finished = true;
          if (code === 0) {
            console.log(`✔ Set ${key} for ${target}`);
            resolve(true);
          } else {
            console.warn(`⚠ Skipped ${key} (possibly already exists)`);
            resolve(false);
          }
        }
      });
      try {
        child.stdin.write(String(value || ''));
        child.stdin.write('\n');
        child.stdin.end();
      } catch (e) {
        console.error(`Could not write value for ${key}:`, e.message);
      }
    }

    bindHandlers(proc);
  });
}

(async () => {
  const env = parseDotEnv(ENV_PATH);

  const keysToSync = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_APP_NAME',
    'BREVO_API_KEY',
    'BREVO_SENDER_EMAIL',
    'BREVO_SENDER_NAME',
    'JOTFORM_API_KEY',
  ];

  for (const key of keysToSync) {
    if (!(key in env)) {
      console.warn(`Skipping ${key}: not found in .env`);
      continue;
    }
    // Do not print secrets
    await runVercelEnvAdd(key, env[key], 'production');
  }

  console.log('Done syncing .env to Vercel (production).');
})();


