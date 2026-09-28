import { nextStage } from "./stages";
import type { CoachPayload, Stage } from "./types";

export function determineProposedStage(
  currentStage: Stage,
  payload: Pick<CoachPayload, "stage_ready" | "recommended_action">,
): Stage | null {
  if (!payload.stage_ready || payload.recommended_action !== "offer_transition") {
    return null;
  }

  return nextStage(currentStage);
}
