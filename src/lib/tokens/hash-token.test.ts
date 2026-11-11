import { describe, expect, it } from "vitest";
import { captureHashToken, forgetToken, readStoredToken, tokenScopeFor } from "./hash-token";

describe("emailed link tokens", () => {
  it("maps each emailed route to its own token scope", () => {
    expect(tokenScopeFor("/games/verify")).toBe("verify");
    expect(tokenScopeFor("/games/turkey-bowl/manage")).toBe("manage:turkey-bowl");
    expect(tokenScopeFor("/games/turkey-bowl/participation/p_1")).toBe("participation:p_1");
    expect(tokenScopeFor("/games/turkey-bowl")).toBeNull();
  });
  it("clears the hash from the address bar and keeps the token in sessionStorage only", () => {
    window.history.replaceState(null, "", "/games/turkey-bowl/manage?ref=email#token=secret-123");
    captureHashToken();
    expect(window.location.hash).toBe("");
    expect(window.location.href).not.toContain("secret-123");
    expect(window.location.search).toBe("?ref=email");
    expect(readStoredToken("manage:turkey-bowl")).toBe("secret-123");
  });
  it("still clears a token on a route that doesn't use one, without storing it", () => {
    window.history.replaceState(null, "", "/games#token=stray");
    captureHashToken();
    expect(window.location.href).not.toContain("stray");
    expect(Object.keys(sessionStorage)).toEqual([]);
  });
  it("leaves the URL alone when there is no token", () => {
    window.history.replaceState(null, "", "/games/verify#section");
    captureHashToken();
    expect(window.location.hash).toBe("#section");
    expect(readStoredToken("verify")).toBeNull();
  });
  it("forgets a spent token", () => {
    window.history.replaceState(null, "", "/games/verify#token=once");
    captureHashToken();
    forgetToken("verify");
    expect(readStoredToken("verify")).toBeNull();
  });
});
