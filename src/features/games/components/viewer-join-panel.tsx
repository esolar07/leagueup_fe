import { getCurrentUser, getSessionToken } from "@/lib/auth/session";
import { gamesApi } from "../api";
import type { OwnParticipation } from "../types";
import { JoinPanel } from "./join-panel";

/** Signed-in players' own request, read with their bearer token. Errors fall back to "no request". */
async function loadMyParticipation(slug: string): Promise<OwnParticipation | null> {
  const bearer = await getSessionToken();
  if (!bearer) return null;
  return gamesApi.detail(slug, bearer).then(({ data }) => data.myParticipation, () => null);
}

/** Server part of the join panel: who's viewing, and whether they've already asked to join. */
export async function ViewerJoinPanel({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const myParticipation = user ? await loadMyParticipation(slug) : null;
  return <JoinPanel slug={slug} viewer={user && { firstName: user.firstName }} myParticipation={myParticipation} />;
}
