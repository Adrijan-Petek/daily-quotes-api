const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'quotes.json');
const OUT_DIR = path.join(ROOT, 'docs');
const API_DIR = path.join(OUT_DIR, 'api');
const QUOTES_PER_PAGE = 10;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function emptyDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function toSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function tokenize(text) {
  const matches = text.toLowerCase().match(/[a-z0-9]+/g);
  if (!matches) return [];
  return matches.filter((token) => token.length >= 3);
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickDailyQuote(quotes, dateString) {
  const hash = hashString(dateString);
  return quotes[hash % quotes.length];
}

function validateQuotes(quotes) {
  if (!Array.isArray(quotes) || quotes.length === 0) {
    throw new Error('Quotes data must be a non-empty array.');
  }

  const seenIds = new Set();
  for (const quote of quotes) {
    if (!quote || typeof quote !== 'object') {
      throw new Error('Each quote must be an object.');
    }

    if (!quote.id || typeof quote.id !== 'string') {
      throw new Error('Each quote must have a string "id".');
    }

    if (seenIds.has(quote.id)) {
      throw new Error(`Duplicate quote id: ${quote.id}`);
    }
    seenIds.add(quote.id);

    if (!quote.quote || typeof quote.quote !== 'string') {
      throw new Error(`Quote ${quote.id} is missing "quote" text.`);
    }

    if (!quote.author || typeof quote.author !== 'string') {
      throw new Error(`Quote ${quote.id} is missing "author".`);
    }

    if (!Array.isArray(quote.tags)) {
      throw new Error(`Quote ${quote.id} must include "tags" array.`);
    }
  }
}

function normalizeQuotes(quotes) {
  return quotes.map((quote) => ({
    ...quote,
    tags: quote.tags.map((tag) => tag.toLowerCase()),
  }));
}

function buildSearchIndex(quotes) {
  const index = {};
  for (const quote of quotes) {
    const tokens = new Set([
      ...tokenize(quote.quote),
      ...tokenize(quote.author),
      ...quote.tags.map((tag) => tag.toLowerCase()),
    ]);

    for (const token of tokens) {
      if (!index[token]) {
        index[token] = [];
      }
      index[token].push(quote.id);
    }
  }

  return index;
}

function buildTagIndex(quotes) {
  const tagMap = new Map();
  for (const quote of quotes) {
    for (const tag of quote.tags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag).push(quote);
    }
  }

  return tagMap;
}

function buildPages(quotes, pageSize) {
  const pages = [];
  for (let i = 0; i < quotes.length; i += pageSize) {
    pages.push(quotes.slice(i, i + pageSize));
  }
  return pages;
}

function copyTemplate(fileName, targetDir) {
  const src = path.join(ROOT, 'templates', fileName);
  const dest = path.join(targetDir, fileName);
  fs.copyFileSync(src, dest);
}

function main() {
  const pkg = readJson(path.join(ROOT, 'package.json'));
  const quotesRaw = readJson(DATA_PATH);
  validateQuotes(quotesRaw);
  const quotes = normalizeQuotes(quotesRaw);

  emptyDir(OUT_DIR);
  ensureDir(API_DIR);
  ensureDir(path.join(OUT_DIR, 'assets'));

  const generatedAt = new Date().toISOString();
  const dateString = generatedAt.slice(0, 10);

  const meta = {
    generatedAt,
    date: dateString,
    version: pkg.version,
    totalQuotes: quotes.length,
  };

  writeJson(path.join(API_DIR, 'quotes.json'), {
    ...meta,
    quotes,
  });

  const daily = pickDailyQuote(quotes, dateString);
  writeJson(path.join(API_DIR, 'daily.json'), {
    ...meta,
    quote: daily,
  });

  const quotesDir = path.join(API_DIR, 'quotes');
  ensureDir(quotesDir);
  const pages = buildPages(quotes, QUOTES_PER_PAGE);
  pages.forEach((pageQuotes, index) => {
    const pageNumber = index + 1;
    writeJson(path.join(quotesDir, `page-${pageNumber}.json`), {
      ...meta,
      page: pageNumber,
      pageSize: QUOTES_PER_PAGE,
      totalPages: pages.length,
      totalQuotes: quotes.length,
      quotes: pageQuotes,
    });
  });
  writeJson(path.join(quotesDir, 'index.json'), {
    ...meta,
    pageSize: QUOTES_PER_PAGE,
    totalPages: pages.length,
    totalQuotes: quotes.length,
    pages: pages.map((_, index) => ({
      page: index + 1,
      href: `./page-${index + 1}.json`,
    })),
  });

  const tagMap = buildTagIndex(quotes);
  const tagDir = path.join(API_DIR, 'tags');
  ensureDir(tagDir);

  const tags = Array.from(tagMap.keys()).sort();
  writeJson(path.join(API_DIR, 'tags.json'), {
    ...meta,
    tags: tags.map((tag) => ({
      tag,
      slug: toSlug(tag),
      totalQuotes: tagMap.get(tag).length,
      href: `./tags/${toSlug(tag)}.json`,
    })),
  });

  for (const tag of tags) {
    const slug = toSlug(tag);
    writeJson(path.join(tagDir, `${slug}.json`), {
      ...meta,
      tag,
      slug,
      totalQuotes: tagMap.get(tag).length,
      quotes: tagMap.get(tag),
    });
  }

  const searchIndex = buildSearchIndex(quotes);
  writeJson(path.join(API_DIR, 'search-index.json'), {
    ...meta,
    tokenCount: Object.keys(searchIndex).length,
    index: searchIndex,
  });

  writeJson(path.join(API_DIR, 'health.json'), {
    status: 'ok',
    ...meta,
  });

  copyTemplate('index.html', OUT_DIR);
  copyTemplate('style.css', path.join(OUT_DIR, 'assets'));
  copyTemplate('app.js', path.join(OUT_DIR, 'assets'));

  console.log(`Built static API to ${OUT_DIR}`);
}

main();
