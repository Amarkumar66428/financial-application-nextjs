import { cacheLife, cacheTag } from "next/cache";

export type NewsArticle = {
  id: string;
  title: string;
  source: string;
};

export type NewsFeed = {
  articles: NewsArticle[];
  generatedAt: string;
};

const FEED_SIZE = 10;

// TODO: swap for a real news provider
const MOCK_ARTICLES: NewsArticle[] = [
  { id: "1", title: "Market hits all-time high", source: "Market Wire" },
  { id: "2", title: "Tech stocks rally continues", source: "Finance Daily" },
  { id: "3", title: "AAPL hits all-time high", source: "Tech Daily" },
  {
    id: "4",
    title: "Samsung will launch new AI phone",
    source: "Tech Daily",
  },
  {
    id: "5",
    title: "Global markets gain as investor confidence rises",
    source: "Market Watch",
  },
  {
    id: "6",
    title: "NVIDIA announces next-generation AI chips",
    source: "Tech Daily",
  },
  {
    id: "7",
    title: "Banking stocks see strong buying activity",
    source: "Finance Daily",
  },
  {
    id: "8",
    title: "Microsoft expands investment in artificial intelligence",
    source: "Finance Daily",
  },
  {
    id: "9",
    title: "Oil prices remain stable amid global demand",
    source: "Market Wire",
  },
  {
    id: "10",
    title: "Amazon shares rise after strong quarterly outlook",
    source: "Finance Daily",
  },
  {
    id: "11",
    title: "Google introduces new AI-powered productivity tools",
    source: "Tech Daily",
  },
  {
    id: "12",
    title: "Indian markets open higher on positive global cues",
    source: "Market Wire",
  },
  {
    id: "13",
    title: "Tesla reports strong demand for latest models",
    source: "Market Watch",
  },
  {
    id: "14",
    title: "Investors increase interest in renewable energy stocks",
    source: "Market Watch",
  },
  {
    id: "15",
    title: "Global technology sector remains in focus",
    source: "Market Wire",
  },
];

// Mock feed rotates every 30s so each regeneration brings different headlines.
async function fetchNewsArticles(): Promise<NewsArticle[]> {
  const offset = Math.floor(Date.now() / 30_000) % MOCK_ARTICLES.length;
  return Array.from(
    { length: FEED_SIZE },
    (_, i) => MOCK_ARTICLES[(offset + i) % MOCK_ARTICLES.length],
  );
}

// Cached and regenerated in the background at most every 30s (ISR).
export async function getNews(): Promise<NewsFeed> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 3600 });
  cacheTag("news");

  const articles = await fetchNewsArticles();
  return { articles, generatedAt: new Date().toISOString() };
}
