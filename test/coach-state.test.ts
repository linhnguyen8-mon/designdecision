import { describe, expect, it } from "vitest";
import { determineProposedStage } from "../src/coach-state";

describe("determineProposedStage", () => {
  it("proposes the next stage only when Gemini says the stage is ready and asks to offer transition", () => {
    expect(
      determineProposedStage("frame", {
        stage_ready: true,
        recommended_action: "offer_transition",
      }),
    ).toBe("research");
  });

  it("does not propose a transition when the current stage still needs work", () => {
    expect(
      determineProposedStage("frame", {
        stage_ready: false,
        recommended_action: "offer_transition",
      }),
    ).toBeNull();
  });

  it("does not move beyond the final stage", () => {
    expect(
      determineProposedStage("validate", {
        stage_ready: true,
        recommended_action: "offer_transition",
      }),
    ).toBeNull();
  });
});
