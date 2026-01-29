/**
 * Field catalog generation script
 * Invokes Python generator from the hub to create TypeScript field catalog
 *
 * Usage: npx tsx scripts/generate-catalog.ts
 */
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const gaimDir = path.resolve(rootDir, '..', 'living-content-gaim');
const hubDir = path.resolve(gaimDir, 'hub');
const outputPath = path.join(rootDir, 'src', 'config', 'field_catalog.generated.ts');

const main = (): void => {
  console.log('Generating field catalog from Python definitions...');

  if (!fs.existsSync(gaimDir)) {
    console.error(`GAIM directory not found: ${gaimDir}`);
    console.error('The tracer must be in the same parent directory as living-content-gaim');
    process.exit(1);
  }

  try {
    execSync(
      `cd ${hubDir} && uv run python -m core.trace.catalog.generator "${outputPath}"`,
      { stdio: 'inherit' },
    );
    console.log(`  Created: ${path.relative(rootDir, outputPath)}`);
    console.log('Field catalog generation complete!');
  } catch {
    console.error('Failed to generate field catalog');
    console.error('Ensure uv is installed and the hub project is set up');
    process.exit(1);
  }
};

main();
