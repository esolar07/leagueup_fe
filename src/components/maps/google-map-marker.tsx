"use client";

import { useEffect, useMemo, useRef } from "react";
import type { LatLng } from "@/lib/maps/config";
import { useMapsLibrary } from "@/lib/maps/use-maps-library";
import { useGoogleMap } from "./google-map";

export type MarkerVariant = "venue" | "selected" | "user";

/** Brand pins. Class strings live here so Tailwind generates them for the DOM nodes Google renders. */
const PIN_CLASSES: Record<MarkerVariant, string> = {
  venue: "size-4 rounded-full border-2 border-brand-navy bg-brand-slate shadow-md",
  selected: "size-6 rounded-full border-[3px] border-white bg-primary shadow-[0_0_0_6px_rgb(166_255_77/0.25)]",
  user: "size-4 rounded-full border-2 border-white bg-sky-400 shadow-[0_0_0_6px_rgb(56_189_248/0.25)]",
};

function pinElement(variant: MarkerVariant): HTMLElement {
  return Object.assign(document.createElement("div"), { className: PIN_CLASSES[variant] });
}

interface GoogleMapMarkerProps {
  position: LatLng;
  title: string;
  variant?: MarkerVariant;
  onSelect?: () => void;
  /** Called with the new position when a draggable marker is dropped. */
  onDragEnd?: (position: LatLng) => void;
}

function useLatestCallbacks(props: GoogleMapMarkerProps) {
  const callbacks = useRef(props);
  useEffect(() => {
    callbacks.current = props;
  });
  return callbacks;
}

/** An advanced marker. Clickable markers are keyboard-focusable buttons named by `title`. */
export function GoogleMapMarker(props: GoogleMapMarkerProps) {
  const map = useGoogleMap();
  const { data: markerLibrary } = useMapsLibrary("marker");
  const marker = useMemo(() => (markerLibrary ? new markerLibrary.AdvancedMarkerElement() : null), [markerLibrary]);
  const callbacks = useLatestCallbacks(props);
  const { position, title, variant = "venue", onSelect, onDragEnd } = props;
  useEffect(() => {
    if (!marker || !map) return;
    const select = () => callbacks.current.onSelect?.();
    const drop = marker.addListener("dragend", () => marker.position && callbacks.current.onDragEnd?.(new google.maps.LatLng(marker.position).toJSON()));
    marker.addEventListener("gmp-click", select);
    // The marker is a Google-owned DOM element, not React state; attach it to the map imperatively.
    Object.assign(marker, { map });
    return () => {
      Object.assign(marker, { map: null });
      marker.removeEventListener("gmp-click", select);
      drop.remove();
    };
  }, [marker, map, callbacks]);
  useEffect(() => {
    if (!marker) return;
    const details = { position, title, content: pinElement(variant), zIndex: variant === "selected" ? 10 : 1 };
    Object.assign(marker, { ...details, gmpClickable: Boolean(onSelect), gmpDraggable: Boolean(onDragEnd) });
  }, [marker, position.lat, position.lng, title, variant, Boolean(onSelect), Boolean(onDragEnd)]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
