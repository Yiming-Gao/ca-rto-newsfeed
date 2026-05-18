function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linkify(value) {
  const safe = escapeHtml(value);
  return safe.replace(
    /(https?:\/\/[^\s)]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">Source</a>'
  );
}

function renderBrief(brief) {
  const title = `${formatShortDate(brief.date)} CA State Worker RTO Newsfeed`;
  const developments = brief.developments
    .map((item) => `<li>${linkify(item)}</li>`)
    .join("");
  const hotTopics = brief.hot_topics
    .map((item) => `<li>${linkify(item)}</li>`)
    .join("");

  return `
    <h2>${escapeHtml(title)}</h2>
    <time datetime="${escapeHtml(brief.date)}">${escapeHtml(brief.date_label)}</time>

    <h3>新进展</h3>
    <ul>${developments}</ul>

    <h3>今日讨论热点</h3>
    <ul>${hotTopics}</ul>

    <h3>一句话总结</h3>
    <p>${linkify(brief.summary)}</p>
  `;
}

async function loadBriefs() {
  if (Array.isArray(window.BRIEFS_DATA)) {
    return window.BRIEFS_DATA;
  }

  const response = await fetch("briefs.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load briefs.json");
  return response.json();
}

function formatShortDate(dateValue) {
  const [, month, day] = dateValue.match(/^\d{4}-(\d{2})-(\d{2})$/) || [];
  return month && day ? `${month}/${day}` : "";
}

loadBriefs()
  .then((briefs) => {
    const latestTarget = document.querySelector("#latest");
    const archiveTarget = document.querySelector("#archive");
    const pageTitle = document.querySelector("#page-title");
    const sorted = [...briefs].sort((a, b) => b.date.localeCompare(a.date));

    if (latestTarget) {
      if (pageTitle && sorted.length) {
        pageTitle.textContent = `${formatShortDate(sorted[0].date)} CA State Worker RTO Newsfeed`;
        document.title = pageTitle.textContent;
      }

      latestTarget.innerHTML = sorted.length
        ? renderBrief(sorted[0])
        : '<p class="loading">暂无简报。</p>';
    }

    if (archiveTarget) {
      const archiveItems = sorted.slice(1);
      archiveTarget.innerHTML = archiveItems.length
        ? archiveItems
            .map(
              (brief) => `
                <details class="archive-item">
                  <summary>${escapeHtml(brief.date_label)}</summary>
                  <article class="brief">${renderBrief(brief)}</article>
                </details>
              `
            )
            .join("")
        : '<p class="loading">暂无历史简报。</p>';
    }
  })
  .catch((error) => {
    const target = document.querySelector("#latest") || document.querySelector("#archive");
    target.innerHTML = `<p class="loading">加载失败：${escapeHtml(error.message)}</p>`;
  });
