import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { failure, mockApi, success } from "@/test/api-mock";
import { buildGame } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { GamesBrowser } from "./games-browser";

const navigation = vi.hoisted(() => ({ search: "", push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigation.search),
  usePathname: () => "/turkey-bowl",
  useRouter: () => ({ push: navigation.push }),
}));

const listResponse = (games = [buildGame()]) => ({ method: "GET", path: "/games", body: success({ games }, { page: 1, perPage: 12, total: games.length, totalPages: 1 }) });

beforeEach(() => {
  navigation.search = "";
  navigation.push.mockReset();
});

describe("games browser", () => {
  it("queries the campaign with no empty parameters and lists games", async () => {
    navigation.search = "q=&city=&skillLevel=BEGINNER";
    const calls = mockApi([listResponse()]);
    renderWithProviders(<GamesBrowser campaignSlug="turkey-bowl-2026" emptyState={<p>none</p>} />);
    expect(await screen.findByText("Turkey Bowl 7v7: Morning Kickoff")).toBeInTheDocument();
    expect(Object.fromEntries(calls[0].url.searchParams)).toEqual({ skillLevel: "BEGINNER", campaign: "turkey-bowl-2026", page: "1", perPage: "12" });
  });
  it("writes applied filters to the URL, without empty values", async () => {
    mockApi([listResponse()]);
    renderWithProviders(<GamesBrowser emptyState={<p>none</p>} />);
    await userEvent.type(await screen.findByLabelText("Search games"), "kendall");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(navigation.push).toHaveBeenCalledWith("/turkey-bowl?q=kendall", { scroll: false });
  });
  it("shows the page's empty state when there are no games and no filters", async () => {
    mockApi([listResponse([])]);
    renderWithProviders(<GamesBrowser emptyState={<p>No Turkey Bowl games yet</p>} />);
    expect(await screen.findByText("No Turkey Bowl games yet")).toBeInTheDocument();
  });
  it("offers to clear filters when filters match nothing", async () => {
    navigation.search = "city=Boca%20Raton";
    mockApi([listResponse([])]);
    renderWithProviders(<GamesBrowser emptyState={<p>none</p>} />);
    expect(await screen.findByText("No games match those filters")).toBeInTheDocument();
  });
  it("shows a friendly error with retry", async () => {
    mockApi([{ method: "GET", path: "/games", status: 429, body: failure("RATE_LIMITED", "Too many requests.") }]);
    renderWithProviders(<GamesBrowser emptyState={<p>none</p>} />);
    expect(await screen.findByText("Too many attempts. Wait a few minutes, then try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
