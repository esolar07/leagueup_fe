import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { failure, mockApi, success } from "@/test/api-mock";
import { buildGame } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import type { Game } from "../types";
import { JoinPanel } from "./join-panel";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const actions = vi.hoisted(() => ({ joinAsMemberAction: vi.fn(), cancelMyRequestAction: vi.fn() }));
vi.mock("../actions", () => actions);

function renderPanel(game: Game, props: Partial<Parameters<typeof JoinPanel>[0]> = {}, routes: Parameters<typeof mockApi>[0] = []) {
  const calls = mockApi([{ method: "GET", path: `/games/${game.slug}`, body: success({ game, myParticipation: null }) }, ...routes]);
  renderWithProviders(<JoinPanel slug={game.slug} viewer={null} myParticipation={null} {...props} />);
  return calls;
}

async function submitGuest() {
  await userEvent.type(await screen.findByLabelText("Your name"), "Sofia Reyes");
  await userEvent.type(screen.getByLabelText("Email"), "sofia@example.com");
  await userEvent.click(screen.getByRole("button", { name: "Request to join" }));
}

describe("join panel", () => {
  it("lets a guest request a spot and explains that the organizer must approve", async () => {
    const game = buildGame();
    const calls = renderPanel(game, {}, [{ method: "POST", path: "/games/game_1/join", status: 201, body: success({ participant: { id: "p1", status: "PENDING", requestedAt: "" }, emailSent: true }) }]);
    await submitGuest();
    expect(await screen.findByText("Request sent to Marcus T.")).toBeInTheDocument();
    expect(screen.getByText(/spot is only held once they approve it/)).toBeInTheDocument();
    expect(calls.find((call) => call.method === "POST")?.body).toEqual({ name: "Sofia Reyes", email: "sofia@example.com" });
  });
  it("validates guest fields before calling the API", async () => {
    const calls = renderPanel(buildGame());
    await userEvent.click(await screen.findByRole("button", { name: "Request to join" }));
    expect(await screen.findByText("Your name is required.")).toBeInTheDocument();
    expect(calls.some((call) => call.method === "POST")).toBe(false);
  });
  it("shows the server's message for a duplicate request (409)", async () => {
    renderPanel(buildGame(), {}, [{ method: "POST", path: "/games/game_1/join", status: 409, body: failure("CONFLICT", "A request for this game already exists.") }]);
    await submitGuest();
    expect(await screen.findByText("A request for this game already exists.")).toBeInTheDocument();
  });
  it("shows the server's message when the game filled up meanwhile (409)", async () => {
    renderPanel(buildGame(), {}, [{ method: "POST", path: "/games/game_1/join", status: 409, body: failure("CONFLICT", "This game is full.") }]);
    await submitGuest();
    expect(await screen.findByText("This game is full.")).toBeInTheDocument();
  });
  it("shows the 429 message when joining is rate limited", async () => {
    renderPanel(buildGame(), {}, [{ method: "POST", path: "/games/game_1/join", status: 429, body: failure("RATE_LIMITED", "Too many requests. Please try again later.") }]);
    await submitGuest();
    expect(await screen.findByText("Too many attempts. Wait a few minutes, then try again.")).toBeInTheDocument();
  });
  it.each([
    [{ availableSpots: 0 }, "This game is full"],
    [{ status: "CLOSED" as const }, "Requests are closed"],
    [{ status: "CANCELLED" as const }, "This game was cancelled"],
    [{ startDateTime: "2020-01-01T14:00:00.000Z" }, "This game has started"],
  ])("does not offer joining when %o", async (overrides, message) => {
    renderPanel(buildGame(overrides));
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request to join" })).not.toBeInTheDocument();
  });
  it("lets a signed-in player join without name or email fields", async () => {
    actions.joinAsMemberAction.mockResolvedValue({ ok: true, data: { participant: { id: "p1", status: "PENDING", requestedAt: "" }, emailSent: true } });
    renderPanel(buildGame(), { viewer: { firstName: "Sofia" } });
    await userEvent.click(await screen.findByRole("button", { name: "Request to join as Sofia" }));
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(actions.joinAsMemberAction).toHaveBeenCalledWith("game_1");
  });
  it("shows a signed-in player's pending request and lets them cancel it", async () => {
    actions.cancelMyRequestAction.mockResolvedValue({ ok: true, data: { participant: { id: "p1", status: "CANCELLED", requestedAt: "" } } });
    renderPanel(buildGame(), { viewer: { firstName: "Sofia" }, myParticipation: { id: "p1", status: "PENDING", requestedAt: "" } });
    expect(await screen.findByText("Waiting on Marcus T.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel my request" }));
    await userEvent.click(await screen.findByRole("button", { name: "Yes, cancel" }));
    expect(actions.cancelMyRequestAction).toHaveBeenCalledWith("game_1", "p1");
  });
});
