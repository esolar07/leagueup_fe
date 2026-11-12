import { describe, expect, it } from "vitest";
import { mockApi, success } from "@/test/api-mock";
import { gamesApi } from "./api";

describe("games API client", () => {
  it("sends the manage token as X-Manage-Token, never in the URL", async () => {
    const calls = mockApi([{ method: "GET", path: "/games/g1/participants", body: success({ participants: [] }) }]);
    await gamesApi.participants("g1", "manage-secret", { status: "PENDING", page: "1", perPage: "20" });
    expect(calls[0].headers.get("X-Manage-Token")).toBe("manage-secret");
    expect(calls[0].url.toString()).not.toContain("manage-secret");
    expect(calls[0].headers.get("Authorization")).toBeNull();
  });
  it("uses X-Manage-Token for edits, decisions and cancelling a game", async () => {
    const calls = mockApi([
      { method: "PATCH", path: /^\/games\/g1/, body: success({}) },
      { method: "DELETE", path: "/games/g1", body: success({}) },
    ]);
    await gamesApi.update("g1", { title: "New" }, "t");
    await gamesApi.decide("g1", "p1", "APPROVED", "t");
    await gamesApi.cancel("g1", "t");
    expect(calls.map((call) => [call.method, call.url.pathname, call.headers.get("X-Manage-Token"), call.body])).toEqual([
      ["PATCH", "/api/v1/games/g1", "t", { title: "New" }],
      ["PATCH", "/api/v1/games/g1/participants/p1", "t", { status: "APPROVED" }],
      ["DELETE", "/api/v1/games/g1", "t", undefined],
    ]);
  });
  it("cancels a guest request with X-Participation-Token and a signed-in one with a bearer token", async () => {
    const calls = mockApi([{ method: "PATCH", path: "/games/g1/participants/p1", body: success({}) }]);
    await gamesApi.cancelParticipation("g1", "p1", { participationToken: "guest-secret" });
    await gamesApi.cancelParticipation("g1", "p1", { bearer: "jwt" });
    expect(calls[0].headers.get("X-Participation-Token")).toBe("guest-secret");
    expect(calls[0].body).toEqual({ status: "CANCELLED" });
    expect(calls[1].headers.get("Authorization")).toBe("Bearer jwt");
    expect(calls[1].headers.get("X-Participation-Token")).toBeNull();
  });
  it("joins as a guest with name and email, and as a member with only a bearer token", async () => {
    const calls = mockApi([{ method: "POST", path: "/games/g1/join", status: 201, body: success({}) }]);
    await gamesApi.joinAsGuest("g1", { name: "Sofia", email: "sofia@example.com" });
    await gamesApi.joinAsMember("g1", "jwt");
    expect(calls[0].body).toEqual({ name: "Sofia", email: "sofia@example.com" });
    expect(calls[1].body).toBeUndefined();
    expect(calls[1].headers.get("Authorization")).toBe("Bearer jwt");
  });
  it("sends the team name on TEAM joins, for guests and members", async () => {
    const calls = mockApi([{ method: "POST", path: "/games/g1/join", status: 201, body: success({}) }]);
    await gamesApi.joinAsGuest("g1", { name: "Sofia", email: "sofia@example.com", teamName: "Gobblers" });
    await gamesApi.joinAsMember("g1", "jwt", "Gobblers");
    expect(calls[0].body).toEqual({ name: "Sofia", email: "sofia@example.com", teamName: "Gobblers" });
    expect(calls[1].body).toEqual({ teamName: "Gobblers" });
  });
});
