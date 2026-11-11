import { StrictMode, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

/** Renders like the app: StrictMode (double effects), React Query, and a Suspense boundary. */
export function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<p>Loading…</p>}>{ui}</Suspense>
      </QueryClientProvider>
    </StrictMode>,
  );
}
