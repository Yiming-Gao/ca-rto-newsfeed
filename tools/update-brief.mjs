import fs from "node:fs/promises";

const root = new URL("../", import.meta.url);
const siteDir = new URL("site/", root);
const docsDir = new URL("docs/", root);
const briefPath = new URL("briefs.json", siteDir);
const dataPath = new URL("briefs-data.js", siteDir);

const redditUrls = [
  "https://www.reddit.com/r/CAStateWorkers/new.json?limit=25",
  "https://www.reddit.com/r/CAStateWorkers/hot.json?limit=25",
  "https://www.reddit.com/r/CAStateWorkers/top.json?t=week&limit=25"
];

function todayParts() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const date = formatter.format(new Date());
  const [, year, month, day] = date.match(/^(\d{4})-(\d{2})-(\d{2})$/) || [];
  return {
    date,
    dateLabel: `${year}年${Number(month)}月${Number(day)}日`
  };
}

async function fetchRedditContext() {
  const responses = await Promise.all(
    redditUrls.map(async (url) => {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "ca-rto-newsfeed/1.0"
        }
      });
      if (!response.ok) return "";
      const payload = await response.json();
      return payload.data.children
        .map(({ data }) => {
          return [
            `Title: ${data.title}`,
            `Score: ${data.score}`,
            `Comments: ${data.num_comments}`,
            `URL: https://www.reddit.com${data.permalink}`,
            `Text: ${(data.selftext || "").slice(0, 600)}`
          ].join("\n");
        })
        .join("\n\n");
    })
  );
  return responses.filter(Boolean).join("\n\n---\n\n").slice(0, 18000);
}

async function generateBrief(context, date, dateLabel) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY secret is required for manual refresh.");
  }

  const prompt = `
Generate a SHORT simplified-Chinese daily RTO news feed about California state workers from Reddit context below.

Focus: Caltrans, Sacramento departments, RTO implementation, telework, office space/hoteling, exemptions, union activity, bills.

Return ONLY valid JSON with this shape:
{
  "date": "${date}",
  "date_label": "${dateLabel}",
  "title": "今日 CA State Worker RTO 情报",
  "developments": ["..."],
  "hot_topics": ["..."],
  "summary": "..."
}

Rules:
- simplified Chinese
- keep English only for RTO, Caltrans, Bill names, union names, HQ
- no long analyst paragraphs
- prioritize new information, rumors, operational details, employee sentiment
- 3-6 developments, each marked 【官方】, 【Rumor】, or 【Reddit热议】
- include source URLs inline in development bullets
- 3-5 short hot topic bullets
- one short summary sentence
- total content roughly 500-800 Chinese characters

Context:
${context}
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  const text = result.output_text || result.output?.flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("");
  return JSON.parse(text);
}

async function syncDocs() {
  await fs.mkdir(docsDir, { recursive: true });
  const files = [
    "index.html",
    "archive.html",
    "render.js",
    "styles.css",
    "briefs.json",
    "briefs-data.js",
    ".nojekyll"
  ];
  for (const file of files) {
    await fs.copyFile(new URL(file, siteDir), new URL(file, docsDir));
  }
}

async function main() {
  const { date, dateLabel } = todayParts();
  const context = await fetchRedditContext();
  const brief = await generateBrief(context, date, dateLabel);
  const existing = JSON.parse(await fs.readFile(briefPath, "utf8"));
  const withoutToday = existing.filter((item) => item.date !== brief.date);
  const next = [brief, ...withoutToday].sort((a, b) => b.date.localeCompare(a.date));

  await fs.writeFile(briefPath, `${JSON.stringify(next, null, 2)}\n`);
  await fs.writeFile(dataPath, `window.BRIEFS_DATA = ${JSON.stringify(next, null, 2)};\n`);
  await syncDocs();
}

await main();
