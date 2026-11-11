/**
 * Marketing campaigns the backend knows about (rows are seeded by backend migration).
 * Shared components take a campaign from here instead of hardcoding one.
 */
export interface Campaign {
  slug: string;
  name: string;
  path: string;
  eyebrow: string;
  headline: readonly [string, string, string];
  tagline: string;
  listingLabel: string;
  /** Date shortcuts for the campaign's filter bar, as calendar days in game time (Eastern, inclusive). */
  datePresets: readonly CampaignDatePreset[];
}

export interface CampaignDatePreset {
  label: string;
  from: string;
  until: string;
}

export const TURKEY_BOWL: Campaign = {
  slug: "turkey-bowl-2026",
  name: "Turkey Bowl",
  path: "/turkey-bowl",
  eyebrow: "Thanksgiving · Thu, Nov 26",
  headline: ["Turkey", "Bowl.", "Let’s play."],
  tagline: "Thanksgiving football starts here.",
  listingLabel: "Feature in the Turkey Bowl hub",
  datePresets: [
    { label: "Thanksgiving Day", from: "2026-11-26", until: "2026-11-26" },
    { label: "Thanksgiving weekend", from: "2026-11-26", until: "2026-11-29" },
    { label: "Thanksgiving week", from: "2026-11-23", until: "2026-11-29" },
  ],
};

/** The campaign an organizer can opt a new listing into. */
export const LISTABLE_CAMPAIGN = TURKEY_BOWL;
