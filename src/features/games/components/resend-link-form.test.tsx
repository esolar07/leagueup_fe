import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { failure, mockApi, success } from "@/test/api-mock";
import { renderWithProviders } from "@/test/render";
import { RESEND_RATE_LIMIT_MESSAGE, ResendLinkForm } from "./resend-link-form";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

describe("resend link", () => {
  it("never claims the email matched the organizer's", async () => {
    const calls = mockApi([{ method: "POST", path: "/games/g1/resend-link", body: success({ accepted: true }) }]);
    renderWithProviders(<ResendLinkForm gameId="g1" defaultEmail="marcus@example.com" />);
    await userEvent.click(screen.getByRole("button", { name: "Resend link" }));
    expect(await screen.findByText(/If that’s the organizer email for this game/)).toBeInTheDocument();
    expect(calls[0].body).toEqual({ email: "marcus@example.com" });
  });
  it("explains 429, including too many unconfirmed listings", async () => {
    mockApi([{ method: "POST", path: "/games/g1/resend-link", status: 429, body: failure("RATE_LIMITED", "Too many unconfirmed listings for this email.") }]);
    renderWithProviders(<ResendLinkForm gameId="g1" defaultEmail="marcus@example.com" />);
    await userEvent.click(screen.getByRole("button", { name: "Resend link" }));
    expect(await screen.findByText(RESEND_RATE_LIMIT_MESSAGE)).toBeInTheDocument();
  });
});
