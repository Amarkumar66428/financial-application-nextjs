import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/skeleton";
import { getNews } from "@/lib/data/news";
import { NewsFeed } from "./news-feed";

export const metadata: Metadata = {
  title: "Market News",
};

// getNews() is cached for 30s, so this is served from cache rather than
// rendered on every request.
export default function NewsPage() {
  return (
    <>
      <PageHeader
        title="Market News"
        description="Latest headlines, refreshed every 30 seconds."
      />
      <Suspense fallback={<Skeleton label="Loading news" />}>
        <NewsList />
      </Suspense>
    </>
  );
}

async function NewsList() {
  const { articles, generatedAt } = await getNews();

  if (articles.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted-foreground">
        No news right now.
      </p>
    );
  }

  return <NewsFeed articles={articles} generatedAt={generatedAt} />;
}
