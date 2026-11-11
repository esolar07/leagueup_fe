import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { failure, mockApi, success } from "@/test/api-mock";
import { renderWithProviders } from "@/test/render";
import { VerifyListing } from "./verify-listing";

const verifyCalls = (calls: ReturnType<typeof mockApi>) => calls.filter((call) => call.url.pathname.endsWith("/games/verify"));

describe("confirm listing page", () => {
  it("verifies exactly once under StrictMode, clears the hash, then links to the live game", async () => {
    window.history.replaceState(null, "", "/games/verify#token=verify-secret");
    const calls = mockApi([{ method: "POST", path: "/games/verify", body: success({ game: { id: "g1", slug: "turkey-bowl", status: "PUBLISHED" }, emailSent: true }) }]);
    renderWithProviders(<VerifyListing />);
    expect(await screen.findByRole("heading", { name: "Your game is live" })).toBeInTheDocument();
    expect(verifyCalls(calls)).toHaveLength(1);
    expect(verifyCalls(calls)[0].body).toEqual({ token: "verify-secret" });
    expect(window.location.href).not.toContain("verify-secret");
    expect(screen.getByText("View your game").closest("a")).toHaveAttribute("href", "/games/turkey-bowl");
    expect(screen.getByText(/manage link is on its way/)).toBeInTheDocument();
  });
  it("shows the invalid-or-expired state when the token was already used (422)", async () => {
    window.history.replaceState(null, "", "/games/verify#token=used");
    mockApi([{ method: "POST", path: "/games/verify", status: 422, body: failure("UNPROCESSABLE", "That link is invalid or has expired.") }]);
    renderWithProviders(<VerifyListing />);
    expect(await screen.findByText("This link is invalid or has expired")).toBeInTheDocument();
  });
  it("shows the invalid state without calling the API when there is no token", async () => {
    window.history.replaceState(null, "", "/games/verify");
    const calls = mockApi([]);
    renderWithProviders(<VerifyListing />);
    expect(await screen.findByText("This link is invalid or has expired")).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });
  it("offers to resend the manage link when its email could not be sent", async () => {
    window.history.replaceState(null, "", "/games/verify#token=t");
    mockApi([{ method: "POST", path: "/games/verify", body: success({ game: { id: "g1", slug: "s", status: "PUBLISHED" }, emailSent: false }) }]);
    renderWithProviders(<VerifyListing />);
    expect(await screen.findByRole("button", { name: /Send my manage link/ })).toBeInTheDocument();
  });
});
