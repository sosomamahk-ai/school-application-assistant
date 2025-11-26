#!/usr/bin/env node

import { runPostTypeResync } from './postTypeSyncRunner';

async function main() {
  const args = process.argv.slice(2);

  const options: { dryRun?: boolean; batchSize?: number; limit?: number } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1], 10);
      i++;
    }
  }

  if (options.dryRun) {
    console.log('⚠️  DRY RUN 模式：不会实际修改数据库\n');
  }

  await runPostTypeResync('university', options);
}

main().catch(console.error);

