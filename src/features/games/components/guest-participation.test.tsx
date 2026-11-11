import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { failure, mockApi, success } from "@/test/api-mock";
import { buildGame } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { GuestParticipation } from "./guest-participation";

vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "turkey-bowl-7v7", participantId: "p1" }) }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const detail = { method: "GET", path: "/games/turkey-bowl-7v7", body: success({ game: buildGame(), myParticipation: null }) };

async function confirmCancel() {
  await userEvent.click(await screen.findByRole("button", { name: "Cancel my request" }));
  await userEvent.click(await screen.findByRole("button", { name: "Yes, cancel" }));
}

beforeEach(() => {
  window.history.replaceState(null, "", "/games/turkey-bowl-7v7/participation/p1#token=guest-secret");
});

describe("guest request page", () => {
  it("cancels with X-Participation-Token and never shows a request status", async () => {
    const calls = mockApi([detail, { method: "PATCH", path: "/games/game_1/participants/p1", body: success({ participant: {} }) }]);
    renderWithProviders(<GuestParticipation />);
    expect(screen.queryByText(/pending|approved/i)).not.toBeInTheDocument();
    await confirmCancel();
    expect(await screen.findByText("Your request was cancelled")).toBeInTheDocument();
    const patch = calls.find((call) => call.method === "PATCH");
    expect(patch?.headers.get("X-Participation-Token")).toBe("guest-secret");
    expect(patch?.body).toEqual({ status: "CANCELLED" });
    expect(window.location.href).not.toContain("guest-secret");
  });
  it("explains when the request can no longer be cancelled (422)", async () => {
    mockApi([detail, { method: "PATCH", path: "/games/game_1/participants/p1", status: 422, body: failure("UNPROCESSABLE", "A REJECTED request cannot become CANCELLED.") }]);
    renderWithProviders(<GuestParticipation />);
    await confirmCancel();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("can no longer be cancelled"));
  });
  it("shows an invalid-link state without a token", async () => {
    window.history.replaceState(null, "", "/games/turkey-bowl-7v7/participation/p1");
    mockApi([detail]);
    renderWithProviders(<GuestParticipation />);
    expect(await screen.findByText("This link is invalid or has expired")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel my request" })).not.toBeInTheDocument();
  });
});
