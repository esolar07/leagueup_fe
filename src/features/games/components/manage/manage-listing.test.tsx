import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { failure, mockApi, success } from "@/test/api-mock";
import { buildGame } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { ManageListing } from "./manage-listing";

vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "turkey-bowl-7v7" }), useRouter: () => ({ refresh: vi.fn() }) }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const game = buildGame();
const detail = { method: "GET", path: "/games/turkey-bowl-7v7", body: success({ game, myParticipation: null }) };
const pending = [{ id: "p1", name: "Sofia Reyes", status: "PENDING", requestedAt: "2026-11-10T15:00:00.000Z" }];

beforeEach(() => {
  window.history.replaceState(null, "", "/games/turkey-bowl-7v7/manage#token=manage-secret");
});

describe("manage listing page", () => {
  it("checks the token by listing participants with X-Manage-Token, and clears the hash", async () => {
    const calls = mockApi([detail, { method: "GET", path: "/games/game_1/participants", body: success({ participants: pending }, { totalPages: 1 }) }]);
    renderWithProviders(<ManageListing />);
    expect(await screen.findByText("Sofia Reyes")).toBeInTheDocument();
    const participantsCall = calls.find((call) => call.url.pathname.endsWith("/participants"));
    expect(participantsCall?.headers.get("X-Manage-Token")).toBe("manage-secret");
    expect(window.location.href).not.toContain("manage-secret");
  });
  it("shows the invalid-link state with a resend form when the API answers 404", async () => {
    mockApi([detail, { method: "GET", path: "/games/game_1/participants", status: 404, body: failure("NOT_FOUND", "Game not found") }]);
    renderWithProviders(<ManageListing />);
    expect(await screen.findByText("This manage link is invalid or has expired")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new manage link/ })).toBeInTheDocument();
  });
  it("shows the invalid-link state when there is no token at all", async () => {
    window.history.replaceState(null, "", "/games/turkey-bowl-7v7/manage");
    mockApi([detail]);
    renderWithProviders(<ManageListing />);
    expect(await screen.findByText("This manage link is invalid or has expired")).toBeInTheDocument();
  });
  it("approves a request with the manage token", async () => {
    const calls = mockApi([
      detail,
      { method: "GET", path: "/games/game_1/participants", body: success({ participants: pending }, { totalPages: 1 }) },
      { method: "PATCH", path: "/games/game_1/participants/p1", body: success({ participant: { ...pending[0], status: "APPROVED" } }) },
    ]);
    renderWithProviders(<ManageListing />);
    await userEvent.click(await screen.findByRole("button", { name: "Approve Sofia Reyes" }));
    const decision = calls.find((call) => call.method === "PATCH");
    expect(decision?.body).toEqual({ status: "APPROVED" });
    expect(decision?.headers.get("X-Manage-Token")).toBe("manage-secret");
    expect(toast.success).toHaveBeenCalledWith("Sofia Reyes approved");
  });
  it("reports a full game when approval answers 409", async () => {
    mockApi([
      detail,
      { method: "GET", path: "/games/game_1/participants", body: success({ participants: pending }, { totalPages: 1 }) },
      { method: "PATCH", path: "/games/game_1/participants/p1", status: 409, body: failure("CONFLICT", "This game is full.") },
    ]);
    renderWithProviders(<ManageListing />);
    await userEvent.click(await screen.findByRole("button", { name: "Approve Sofia Reyes" }));
    expect(toast.error).toHaveBeenCalledWith("This game is full.");
  });
  it("cancels the game only after confirmation, with DELETE and the manage token", async () => {
    const calls = mockApi([
      detail,
      { method: "GET", path: "/games/game_1/participants", body: success({ participants: [] }, { totalPages: 1 }) },
      { method: "DELETE", path: "/games/game_1", body: success({ game: { ...game, status: "CANCELLED" } }) },
    ]);
    renderWithProviders(<ManageListing />);
    await userEvent.click(await screen.findByRole("button", { name: "Cancel game" }));
    expect(calls.some((call) => call.method === "DELETE")).toBe(false);
    await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel game" }));
    expect(calls.find((call) => call.method === "DELETE")?.headers.get("X-Manage-Token")).toBe("manage-secret");
    expect(await screen.findByText(/can no longer be changed/)).toBeInTheDocument();
  });
});
