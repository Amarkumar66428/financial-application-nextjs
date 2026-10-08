import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/skeleton";
import { fetchPortfolio } from "@/lib/api/portfolio";
import { AUTH_COOKIE } from "@/lib/auth/token";
import { LivePortfolio } from "./_components/live-portfolio";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Overview of your holdings and performance."
      />
      <Suspense fallback={<Skeleton label="Loading portfolio" cards={4} />}>
        <Portfolio />
      </Suspense>
    </>
  );
}

async function Portfolio() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  const holdings = await fetchPortfolio(token);

  return <LivePortfolio initialHoldings={holdings} />;
}
