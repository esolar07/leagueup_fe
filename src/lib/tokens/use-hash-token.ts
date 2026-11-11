"use client";

import { use, useState } from "react";
import { browser } from "react-dom";
import { captureHashToken, readStoredToken } from "./hash-token";

/**
 * The emailed token for this page, or null. instrumentation-client.ts normally captures
 * it before hydration; capturing again here covers any path that skipped that. Browser
 * only: render inside <Suspense>.
 */
export function useHashToken(scope: string): string | null {
  use(browser("Emailed link tokens live in the URL fragment and sessionStorage."));
  const [token] = useState(() => {
    captureHashToken();
    return readStoredToken(scope);
  });
  return token;
}
