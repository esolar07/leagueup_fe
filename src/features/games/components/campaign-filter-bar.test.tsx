import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TURKEY_BOWL } from "@/config/campaigns";
import { renderWithProviders } from "@/test/render";
import { CampaignFilterBar } from "./campaign-filter-bar";

const navigation = vi.hoisted(() => ({ search: "", push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigation.search),
  usePathname: () => "/turkey-bowl",
  useRouter: () => ({ push: navigation.push }),
}));

beforeEach(() => {
  navigation.search = "";
  navigation.push.mockReset();
});

describe("campaign filter bar", () => {
  it("shows the four segments with their defaults", async () => {
    renderWithProviders(<CampaignFilterBar campaign={TURKEY_BOWL} />);
    expect(await screen.findByRole("search", { name: "Find Turkey Bowl games" })).toBeInTheDocument();
    expect(screen.getByLabelText("Location")).toHaveAttribute("placeholder", "City or ZIP");
    expect(screen.getByRole("combobox", { name: /Date\s*Any date/ })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Skill level\s*All levels/ })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Players needed\s*Any/ })).toBeInTheDocument();
  });
  it("reads a Thanksgiving-week URL back into the bar", async () => {
    navigation.search = "city=Miami&state=FL&date=2026-11-23&until=2026-11-29&skillLevel=BEGINNER&hasSpots=true";
    renderWithProviders(<CampaignFilterBar campaign={TURKEY_BOWL} />);
    expect(await screen.findByLabelText("Location")).toHaveValue("Miami, FL");
    expect(screen.getByRole("combobox", { name: /Thanksgiving week/ })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Beginner/ })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Still needs players/ })).toBeInTheDocument();
  });
  it("searches by ZIP and keeps the chosen filters in the URL", async () => {
    navigation.search = "date=2026-11-26&until=2026-11-26";
    renderWithProviders(<CampaignFilterBar campaign={TURKEY_BOWL} />);
    await userEvent.type(await screen.findByLabelText("Location"), "33155");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(navigation.push).toHaveBeenCalledWith("/turkey-bowl?postalCode=33155&date=2026-11-26&until=2026-11-26", { scroll: false });
  });
  it("picks a date preset from the menu", async () => {
    renderWithProviders(<CampaignFilterBar campaign={TURKEY_BOWL} />);
    await userEvent.click(await screen.findByRole("combobox", { name: /Date/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Thanksgiving weekend" }));
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(navigation.push).toHaveBeenCalledWith("/turkey-bowl?date=2026-11-26&until=2026-11-29", { scroll: false });
  });
});
