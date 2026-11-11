"use client";

import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { MapPinOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { isMapsConfigured, mapsMapId, type LatLng } from "@/lib/maps/config";
import { useMapsAuthFailed, useMapsLibrary } from "@/lib/maps/use-maps-library";
import { cn } from "@/lib/utils";

const GoogleMapContext = createContext<google.maps.Map | null>(null);

/** The map a marker belongs to. Only valid inside <GoogleMap>. */
export function useGoogleMap(): google.maps.Map | null {
  return use(GoogleMapContext);
}

export interface GoogleMapProps {
  center: LatLng;
  zoom?: number;
  /** Accessible name for the map region, e.g. "Map of Tropical Park". */
  label: string;
  className?: string;
  /** "static" turns off panning/zooming (previews); "interactive" keeps zoom buttons and cooperative gestures. */
  mode?: "interactive" | "static";
  onMapClick?: (position: LatLng) => void;
  children?: ReactNode;
}

function mapOptions(center: LatLng, zoom: number, mode: GoogleMapProps["mode"]): google.maps.MapOptions {
  const interactive = mode === "interactive";
  return {
    center,
    zoom,
    mapId: mapsMapId(),
    colorScheme: "DARK",
    disableDefaultUI: true,
    zoomControl: interactive,
    clickableIcons: false,
    keyboardShortcuts: interactive,
    gestureHandling: interactive ? "cooperative" : "none",
  };
}

/** The map is created when its container mounts (a ref callback, not an effect); later center/zoom changes are applied in place. */
function useMapInstance(props: GoogleMapProps) {
  const { data: mapsLibrary } = useMapsLibrary("maps");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { center, zoom = 14, mode = "interactive" } = props;
  const initialOptions = useRef(mapOptions(center, zoom, mode));
  const attach = useCallback(
    (container: HTMLDivElement | null) => {
      if (container && mapsLibrary) setMap(new mapsLibrary.Map(container, initialOptions.current));
    },
    [mapsLibrary],
  );
  useEffect(() => map?.panTo(center), [map, center.lat, center.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => map?.setZoom(zoom), [map, zoom]);
  return { map, attach };
}

function useMapClick(map: google.maps.Map | null, onMapClick: GoogleMapProps["onMapClick"]) {
  const handler = useRef(onMapClick);
  useEffect(() => {
    handler.current = onMapClick;
  });
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("click", (event: google.maps.MapMouseEvent) => event.latLng && handler.current?.(event.latLng.toJSON()));
    return () => listener.remove();
  }, [map]);
}

/** Dark, brand-styled Google Map. Renders nothing when Maps isn't configured; shows a notice if it fails to load. */
export function GoogleMap(props: GoogleMapProps) {
  const { map, attach } = useMapInstance(props);
  const { isError } = useMapsLibrary("maps");
  const authFailed = useMapsAuthFailed();
  useMapClick(map, props.onMapClick);
  if (!isMapsConfigured()) return null;
  if (isError || authFailed) return <MapUnavailable className={props.className} />;
  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border bg-card", props.className)}>
      <div ref={attach} role="region" aria-label={props.label} className="size-full" />
      {!map && <Skeleton className="absolute inset-0 rounded-none" aria-label="Loading map" />}
      {map && <GoogleMapContext value={map}>{props.children}</GoogleMapContext>}
    </div>
  );
}

function MapUnavailable({ className }: { className?: string }) {
  return (
    <div role="note" className={cn("flex items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground", className)}>
      <MapPinOff className="size-4" aria-hidden /> Map unavailable right now.
    </div>
  );
}
