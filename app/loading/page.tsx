"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Loading from "@/components/loadings";

function LoadingWithParams() {
  const searchParams = useSearchParams();
  const queryMessage = searchParams ? searchParams.get("message") : null;
  const queryShowProgress = searchParams ? searchParams.get("showProgress") : null;
  const queryFullScreen = searchParams ? searchParams.get("fullScreen") : null;

  const resolvedMessage = queryMessage || undefined;
  const resolvedShowProgress = queryShowProgress !== "false";
  const resolvedFullScreen = queryFullScreen !== "false";

  return (
    <Loading
      message={resolvedMessage}
      showProgress={resolvedShowProgress}
      fullScreen={resolvedFullScreen}
    />
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoadingWithParams />
    </Suspense>
  );
}
