import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLACE_FIELDS } from "@/lib/maps/place-selection";
import { fakeMapsLibraries, fakePlace, fakePrediction } from "@/test/google-maps-fake";
import { renderWithProviders } from "@/test/render";
import { AddressAutocomplete } from "./address-autocomplete";

const fake = vi.hoisted(() => ({ current: null as ReturnType<typeof fakeMapsLibraries> | null }));
vi.mock("@/lib/maps/use-maps-library", () => ({
  useMapsLibrary: (name: string) => ({ data: (fake.current!.libraries as unknown as Record<string, unknown>)[name], isError: false }),
  useMapsAuthFailed: () => false,
}));

const park = fakePlace();

beforeEach(() => {
  fake.current = fakeMapsLibraries();
  fake.current.places.AutocompleteSuggestion.fetchAutocompleteSuggestions.mockResolvedValue({
    suggestions: [{ placePrediction: fakePrediction("place_tropical", "Tropical Park", "SW 40th St, Miami, FL", park) }, { placePrediction: fakePrediction("place_other", "Tropical Park Stadium", "Miami, FL") }],
  });
});

function renderAutocomplete() {
  const onSelect = vi.fn();
  renderWithProviders(<AddressAutocomplete id="venue" label="Find the park or field" onSelect={onSelect} />);
  return { onSelect, input: screen.getByRole("combobox", { name: "Find the park or field" }), fetchSuggestions: fake.current!.places.AutocompleteSuggestion.fetchAutocompleteSuggestions };
}

describe("AddressAutocomplete", () => {
  it("waits for 3 characters and a pause in typing before asking Google", async () => {
    const { input, fetchSuggestions } = renderAutocomplete();
    await userEvent.type(input, "tr");
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(fetchSuggestions).not.toHaveBeenCalled();
    await userEvent.type(input, "opical");
    expect(await screen.findByRole("option", { name: /^Tropical Park,\s*SW 40th St, Miami, FL$/ })).toBeInTheDocument();
    expect(fetchSuggestions).toHaveBeenCalledTimes(1);
    expect(fetchSuggestions.mock.calls[0][0]).toMatchObject({ input: "tropical", includedRegionCodes: ["us"], locationBias: { radius: expect.any(Number) } });
  });
  it("is keyboard operable and returns place id, address, coordinates and components", async () => {
    const { input, onSelect } = renderAutocomplete();
    await userEvent.type(input, "tropical");
    await screen.findByRole("option", { name: /^Tropical Park,\s*SW 40th St, Miami, FL$/ });
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(onSelect).toHaveBeenCalledOnce());
    expect(park.fetchFields).toHaveBeenCalledWith({ fields: PLACE_FIELDS });
    expect(onSelect.mock.calls[0][0]).toMatchObject({ placeId: "place_tropical", name: "Tropical Park", formattedAddress: "7900 SW 40th St, Miami, FL 33155, USA", latitude: 25.7334, longitude: -80.3507 });
    expect(onSelect.mock.calls[0][0].addressComponents).toHaveLength(5);
  });
  it("reuses one session token while typing and starts a new one after a selection", async () => {
    const { input, onSelect, fetchSuggestions } = renderAutocomplete();
    await userEvent.type(input, "trop");
    await screen.findAllByRole("option");
    await userEvent.type(input, "ical");
    await waitFor(() => expect(fetchSuggestions).toHaveBeenCalledTimes(2));
    expect(fetchSuggestions.mock.calls[0][0].sessionToken).toBe(fetchSuggestions.mock.calls[1][0].sessionToken);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(onSelect).toHaveBeenCalled());
    await userEvent.clear(input);
    await userEvent.type(input, "kendall");
    await waitFor(() => expect(fetchSuggestions).toHaveBeenCalledTimes(3));
    expect(fetchSuggestions.mock.calls[2][0].sessionToken).not.toBe(fetchSuggestions.mock.calls[0][0].sessionToken);
  });
  it("falls back to manual entry when Google fails", async () => {
    fake.current!.places.AutocompleteSuggestion.fetchAutocompleteSuggestions.mockRejectedValue(new Error("quota"));
    const { input } = renderAutocomplete();
    await userEvent.type(input, "tropical");
    expect(await screen.findByText(/Type the address in the fields below/)).toBeInTheDocument();
  });
});
