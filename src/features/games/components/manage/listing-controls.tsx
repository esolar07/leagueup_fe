"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { Button } from "@/components/ui/button";
import { friendlyErrorMessage } from "@/lib/api/error-messages";
import { gamesApi } from "../../api";
import { useStoreGame } from "../../hooks";
import type { Game } from "../../types";

/** Close / reopen requests, and cancel (final). Only rendered while the game is editable. */
export function ListingControls({ game, manageToken }: { game: Game; manageToken: string }) {
  const storeGame = useStoreGame();
  const closing = game.status === "PUBLISHED";
  const toggle = useMutation({
    mutationFn: () => gamesApi.update(game.id, { status: closing ? "CLOSED" : "PUBLISHED" }, manageToken),
    onSuccess: ({ data }) => {
      storeGame(data.game);
      toast.success(data.game.status === "CLOSED" ? "Requests closed" : "Requests reopened");
    },
    onError: (error) => toast.error(friendlyErrorMessage(error)),
  });
  async function cancelGame() {
    try {
      storeGame((await gamesApi.cancel(game.id, manageToken)).data.game);
      toast.success("Game cancelled");
    } catch (error) {
      toast.error(friendlyErrorMessage(error));
      throw error;
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toggle.mutate()} disabled={toggle.isPending}>
        {toggle.isPending && <Loader2 className="animate-spin" aria-hidden />}
        {closing ? "Close requests" : "Reopen requests"}
      </Button>
      <ConfirmAction
        trigger="Cancel game"
        triggerVariant="destructive"
        title="Cancel this game?"
        description="This is final: the listing will show as cancelled and no one can join or be approved. You can’t undo it."
        confirmLabel="Cancel game"
        onConfirm={cancelGame}
      />
    </div>
  );
}
