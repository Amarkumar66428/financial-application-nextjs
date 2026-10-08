"use client";

import { ErrorState } from "@/components/error-state";

export default function NewsError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState title="Could not load market news" {...props} />;
}
