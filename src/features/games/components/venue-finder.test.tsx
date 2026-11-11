import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMapsLibraries, fakePlace, fakePrediction } from "@/test/google-maps-fake";
import { renderWithProviders } from "@/test/render";
import { EMPTY_LISTING, type ListingValues } from "../schemas";
import { VenueFinder } from "./venue-finder";

const fake = vi.hoisted(() => ({ current: null as ReturnType<typeof fakeMapsLibraries> | null }));
vi.mock("@/lib/maps/use-maps-library", () => ({
  useMapsLibrary: (name: string) => ({ data: (fake.current!.libraries as unknown as Record<string, unknown>)[name], isError: false }),
  useMapsAuthFailed: () => false,
}));

const formRef: { current: ReturnType<typeof useForm<ListingValues>> | null } = { current: null };
function Harness({ venueName = "" }: { venueName?: string }) {
  const form = useForm<ListingValues>({ defaultValues: { ...EMPTY_LISTING, venueName, city: "" } });
  useEffect(() => {
    formRef.current = form;
  });
  return (
    <FormProvider {...form}>
      <VenueFinder />
    </FormProvider>
  );
}

async function pick(place: ReturnType<typeof fakePlace>, venueName?: string) {
  fake.current!.places.AutocompleteSuggestion.fetchAutocompleteSuggestions.mockResolvedValue({ suggestions: [{ placePrediction: fakePrediction(place.id, "Result", "Miami, FL", place) }] });
  renderWithProviders(<Harness venueName={venueName} />);
  await userEvent.type(screen.getByRole("combobox", { name: "Find the park or field" }), "tropical");
  await screen.findByRole("option");
  await userEvent.keyboard("{ArrowDown}{Enter}");
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "test-key");
  fake.current = fakeMapsLibraries();
});
afterEach(() => vi.unstubAllEnvs());

describe("VenueFinder in the game form", () => {
  it("fills venue, address, city, state and ZIP from a picked park, then shows the pin to confirm", async () => {
    await pick(fakePlace());
    await waitFor(() => expect(formRef.current!.getValues("venueName")).toBe("Tropical Park"));
    expect(formRef.current!.getValues()).toMatchObject({ address: "7900 Southwest 40th Street", city: "Miami", state: "FL", postalCode: "33155" });
    expect(await screen.findByRole("region", { name: "Game location" })).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("doesn’t know whether a field is open or free to use");
  });
  it("keeps the organizer's venue name when a bare street address is picked", async () => {
    await pick(fakePlace({ id: "addr", displayName: "7900 SW 40th St", types: ["street_address"] }), "Tropical Park, Field 3");
    await waitFor(() => expect(formRef.current!.getValues("address")).toBe("7900 Southwest 40th Street"));
    expect(formRef.current!.getValues("venueName")).toBe("Tropical Park, Field 3");
  });
  it("renders nothing without a Maps key, leaving the manual fields", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    const { container } = renderWithProviders(<Harness />);
    expect(container).toBeEmptyDOMElement();
  });
});
