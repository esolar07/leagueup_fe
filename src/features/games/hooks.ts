"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gamesApi } from "./api";
import type { Game } from "./types";

export const gameKeys = {
  list: (query: Record<string, string>) => ["games", query] as const,
  detail: (slug: string) => ["game", slug] as const,
  participants: (gameId: string) => ["participants", gameId] as const,
};

/** Public game details, fetched from the browser so the API rate-limits each visitor, not our server. */
export function useGameDetail(slug: string) {
  return useQuery({
    queryKey: gameKeys.detail(slug),
    queryFn: async () => (await gamesApi.detail(slug)).data.game,
  });
}

/** Writes a game returned by a mutation into the cache, and refreshes lists that may show it. */
export function useStoreGame() {
  const queryClient = useQueryClient();
  return (game: Game) => {
    queryClient.setQueryData(gameKeys.detail(game.slug), game);
    void queryClient.invalidateQueries({ queryKey: ["games"] });
  };
}
