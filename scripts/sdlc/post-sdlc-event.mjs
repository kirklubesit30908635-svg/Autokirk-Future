#!/usr/bin/env node
import fs from 'node:fs';

const ingestUrl = process.env.AUTOKIRK_SDLC_INGEST_URL;
const ingestKey = process.env.AUTOKIRK_SDLC_INGEST_KEY;
const files = process.argv.slice(2);

if (!files.length) {
  console.error('Usage: node scripts/sdlc/post-sdlc-event.mjs <event.json> [...]');
  process.exit(1);
}

if (!ingestUrl) {
  console.log('AUTOKIRK_SDLC_INGEST_URL is not configured; preserving artifacts without posting to kernel.');
  process.exit(0);
}

let failed = false;
for (const file of files) {
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const headers = { 'Content-Type': 'application/json' };
  if (ingestKey) headers.Authorization = `Bearer ${ingestKey}`;

  const response = await fetch(ingestUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  if (!response.ok) {
    failed = true;
    console.error(`Failed to post ${file}: HTTP ${response.status}`);
    console.error(text);
  } else {
    console.log(`Posted ${file}: HTTP ${response.status}`);
    if (text) console.log(text);
  }
}

process.exit(failed ? 1 : 0);
