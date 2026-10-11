const fs = require('fs');
const path = require('path');

const EXPECTED_VERSION = '1.20.10';

const pkgJsonPath = path.join(
  __dirname,
  '../node_modules/@opennextjs/cloudflare/package.json'
);

const targetFile = path.join(
  __dirname,
  '../node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js'
);

function applyPatch() {
  if (!fs.existsSync(pkgJsonPath)) {
    throw new Error(`[patch-opennext] Missing @opennextjs/cloudflare package.json at ${pkgJsonPath}`);
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  if (pkgJson.version !== EXPECTED_VERSION) {
    throw new Error(
      `[patch-opennext] Version mismatch: expected @opennextjs/cloudflare@${EXPECTED_VERSION}, but found ${pkgJson.version}. Please verify upstream Next.js 16 support before updating.`
    );
  }

  if (!fs.existsSync(targetFile)) {
    throw new Error(`[patch-opennext] Target patch file does not exist at ${targetFile}`);
  }

  let content = fs.readFileSync(targetFile, 'utf8');

  // If already patched, verify and exit successfully
  if (content.includes('preview-props}.json')) {
    console.log('[patch-opennext] @opennextjs/cloudflare is already patched for Next.js 16 preview-props.json');
    return;
  }

  const originalPattern = '**/{*-manifest,required-server-files,prefetch-hints}.json';
  const patchedPattern = '**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json';

  if (!content.includes(originalPattern)) {
    throw new Error(
      `[patch-opennext] Original pattern "${originalPattern}" not found in ${targetFile}. Adapter internals have changed!`
    );
  }

  content = content.replace(originalPattern, patchedPattern);
  fs.writeFileSync(targetFile, content, 'utf8');

  // Verify write succeeded
  const verified = fs.readFileSync(targetFile, 'utf8');
  if (!verified.includes(patchedPattern)) {
    throw new Error('[patch-opennext] Verification failed after writing patched file.');
  }

  console.log('✔ [patch-opennext] Successfully patched @opennextjs/cloudflare load-manifest for Next.js 16');
}

try {
  applyPatch();
} catch (err) {
  console.error(`❌ [patch-opennext] Error: ${err.message}`);
  process.exit(1);
}
