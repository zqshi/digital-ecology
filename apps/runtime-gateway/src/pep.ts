import { evaluateMissionTransition } from "../../../services/policy-pdp/src/index";
import type { MissionStatus } from "../../../apps/mission-broker/src/domain/types";

export interface TransitionCheckRequest {
  actorId: string;
  missionId: string;
  fromStatus: MissionStatus;
  toStatus: MissionStatus;
  highRisk?: boolean;
  dualApproval?: boolean;
}

export async function enforceTransitionPolicy(
  req: TransitionCheckRequest
): Promise<{ allowed: boolean; reason: string }> {
  return evaluateMissionTransition(req);
}
