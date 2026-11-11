"use client";

import { useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { MAPS_REGION, DEFAULT_MAP_CENTER, SEARCH_BIAS_RADIUS_METERS, type LatLng } from "@/lib/maps/config";
import { PLACE_FIELDS, selectionFromPlace, type PlaceSelection } from "@/lib/maps/place-selection";
import { useMapsLibrary } from "@/lib/maps/use-maps-library";

export const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 250;

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  prediction: google.maps.places.PlacePrediction;
}

function toSuggestion(prediction: google.maps.places.PlacePrediction): PlaceSuggestion {
  return {
    placeId: prediction.placeId,
    mainText: prediction.mainText?.text ?? prediction.text.text,
    secondaryText: prediction.secondaryText?.text ?? "",
    prediction,
  };
}

/**
 * Suggestions share one Places session token until a place is picked (fetchFields ends the
 * session), so a whole search is billed as one session. Requests wait for a pause in typing.
 */
function usePlaceSuggestions(input: string, bias: LatLng) {
  const { data: places } = useMapsLibrary("places");
  const session = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const query = useDebouncedValue(input.trim(), DEBOUNCE_MS);
  const suggestions = useQuery({
    queryKey: ["place-suggestions", query, bias.lat, bias.lng],
    queryFn: async () => {
      session.current ??= new places!.AutocompleteSessionToken();
      const request = { input: query, sessionToken: session.current, locationBias: { center: bias, radius: SEARCH_BIAS_RADIUS_METERS }, includedRegionCodes: [MAPS_REGION], region: MAPS_REGION };
      const { suggestions } = await places!.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      return suggestions.flatMap((suggestion) => (suggestion.placePrediction ? [toSuggestion(suggestion.placePrediction)] : []));
    },
    enabled: Boolean(places) && query.length >= MIN_QUERY_LENGTH,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    retry: false,
  });
  const endSession = () => (session.current = null);
  return { suggestions, query, ready: Boolean(places), endSession };
}

function emptyMessage(query: string, searching: boolean, failed: boolean): string {
  if (failed) return "Address search isn’t working right now. Type the address in the fields below.";
  if (query.length < MIN_QUERY_LENGTH) return `Type at least ${MIN_QUERY_LENGTH} characters.`;
  return searching ? "Searching…" : "No matches. Type the address in the fields below.";
}

interface AddressAutocompleteProps {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  /** Where to prefer results (the user's location when shared, else the default map area). */
  bias?: LatLng;
  onSelect: (selection: PlaceSelection) => void;
}

/** Accessible Google Places autocomplete (combobox + listbox, full keyboard support). Manual entry stays possible next to it. */
export function AddressAutocomplete({ id, label, description, placeholder = "Park, field or address", bias = DEFAULT_MAP_CENTER, onSelect }: AddressAutocompleteProps) {
  const [input, setInput] = useState("");
  const { suggestions, query, ready, endSession } = usePlaceSuggestions(input, bias);
  const details = useMutation({
    mutationFn: async (suggestion: PlaceSuggestion) => {
      const place = suggestion.prediction.toPlace();
      await place.fetchFields({ fields: PLACE_FIELDS });
      return selectionFromPlace(place);
    },
    onSuccess: onSelect,
    onSettled: endSession,
  });
  const searching = suggestions.isFetching || input.trim() !== query;
  const status = details.isPending ? "Getting the address…" : details.isError ? "Couldn’t load that place. Pick it again or type the address below." : null;
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Combobox<PlaceSuggestion>
        items={suggestions.data ?? []}
        filter={null}
        itemToStringLabel={(suggestion) => suggestion.mainText}
        isItemEqualToValue={(item, value) => item.placeId === value.placeId}
        onInputValueChange={setInput}
        onValueChange={(suggestion) => suggestion && details.mutate(suggestion)}
        disabled={!ready}
      >
        <ComboboxInput id={id} placeholder={placeholder} showTrigger={false} showClear aria-describedby={`${id}-description ${id}-status`} />
        <ComboboxContent>
          <ComboboxEmpty>{emptyMessage(query, searching, suggestions.isError)}</ComboboxEmpty>
          <ComboboxList>
            {(suggestion: PlaceSuggestion) => (
              <ComboboxItem key={suggestion.placeId} value={suggestion} className="items-start py-2">
                <MapPin className="mt-0.5 text-muted-foreground" aria-hidden />
                <span className="grid">
                  <span className="font-medium">{suggestion.mainText}</span>
                  <span className="sr-only">, </span>
                  <span className="text-xs text-muted-foreground">{suggestion.secondaryText}</span>
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
          <p className="border-t border-border px-3 py-1.5 text-right text-[10px] text-muted-foreground">Powered by Google</p>
        </ComboboxContent>
      </Combobox>
      {description && <p id={`${id}-description`} className="text-sm text-muted-foreground">{description}</p>}
      <p id={`${id}-status`} role="status" className="flex items-center gap-2 text-sm text-muted-foreground empty:hidden">
        {details.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {status}
      </p>
    </div>
  );
}
