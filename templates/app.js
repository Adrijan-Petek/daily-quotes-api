const state = {
  quotes: [],
  tags: [],
  page: 1,
  pageSize: 10,
  query: '',
  tag: '',
};

const elements = {
  baseUrl: document.getElementById('base-url'),
  healthStatus: document.getElementById('health-status'),
  dailyQuote: document.getElementById('daily-quote'),
  searchInput: document.getElementById('search-input'),
  tagSelect: document.getElementById('tag-select'),
  results: document.getElementById('results'),
  prevPage: document.getElementById('prev-page'),
  nextPage: document.getElementById('next-page'),
  pageInfo: document.getElementById('page-info'),
};

function getBaseUrl() {
  const url = window.location.origin + window.location.pathname;
  return url.replace(/index\.html?$/, '').replace(/\/$/, '');
}

function setBaseUrl() {
  const baseUrl = getBaseUrl();
  elements.baseUrl.textContent = baseUrl;
  return baseUrl;
}

function renderDailyQuote(daily) {
  if (!daily || !daily.quote) {
    elements.dailyQuote.textContent = 'Daily quote unavailable.';
    return;
  }
  elements.dailyQuote.innerHTML = `"${daily.quote.quote}" — ${daily.quote.author}`;
}

function renderTags() {
  for (const tag of state.tags) {
    const option = document.createElement('option');
    option.value = tag.tag;
    option.textContent = `${tag.tag} (${tag.totalQuotes})`;
    elements.tagSelect.appendChild(option);
  }
}

function filterQuotes() {
  const query = state.query.toLowerCase().trim();
  return state.quotes.filter((quote) => {
    const matchesTag = !state.tag || quote.tags.includes(state.tag);
    const matchesQuery =
      !query ||
      quote.quote.toLowerCase().includes(query) ||
      quote.author.toLowerCase().includes(query);
    return matchesTag && matchesQuery;
  });
}

function renderQuotes() {
  const filtered = filterQuotes();
  const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
  state.page = Math.min(state.page, totalPages);

  const start = (state.page - 1) * state.pageSize;
  const pageQuotes = filtered.slice(start, start + state.pageSize);

  elements.results.innerHTML = '';
  if (pageQuotes.length === 0) {
    elements.results.textContent = 'No quotes found.';
  } else {
    for (const quote of pageQuotes) {
      const item = document.createElement('div');
      item.className = 'quote-item';
      item.innerHTML = `"${quote.quote}" <span>${quote.author} · ${quote.tags.join(', ')}</span>`;
      elements.results.appendChild(item);
    }
  }

  elements.pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
  elements.prevPage.disabled = state.page === 1;
  elements.nextPage.disabled = state.page === totalPages;
}

async function loadApi() {
  const baseUrl = setBaseUrl();
  const [quotesResponse, tagsResponse, dailyResponse, healthResponse] = await Promise.all([
    fetch(`${baseUrl}/api/quotes.json`),
    fetch(`${baseUrl}/api/tags.json`),
    fetch(`${baseUrl}/api/daily.json`),
    fetch(`${baseUrl}/api/health.json`),
  ]);

  const quotesData = await quotesResponse.json();
  const tagsData = await tagsResponse.json();
  const dailyData = await dailyResponse.json();
  const healthData = await healthResponse.json();

  state.quotes = quotesData.quotes || [];
  state.tags = tagsData.tags || [];

  elements.healthStatus.textContent = `${healthData.status} · ${healthData.generatedAt}`;

  renderDailyQuote(dailyData);
  renderTags();
  renderQuotes();
}

elements.searchInput.addEventListener('input', (event) => {
  state.query = event.target.value;
  state.page = 1;
  renderQuotes();
});

elements.tagSelect.addEventListener('change', (event) => {
  state.tag = event.target.value;
  state.page = 1;
  renderQuotes();
});

elements.prevPage.addEventListener('click', () => {
  state.page = Math.max(1, state.page - 1);
  renderQuotes();
});

elements.nextPage.addEventListener('click', () => {
  state.page += 1;
  renderQuotes();
});

loadApi().catch((error) => {
  elements.results.textContent = 'Failed to load API data.';
  elements.dailyQuote.textContent = 'Failed to load daily quote.';
  elements.healthStatus.textContent = 'error';
  console.error(error);
});
