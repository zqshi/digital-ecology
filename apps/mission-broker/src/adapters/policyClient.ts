import { evaluateMissionTransition } from "../../../../services/policy-pdp/src/index";
import type { MissionStatus } from "../domain/types";

export async function checkTransitionPolicy(params: {
  actorId: string;
  missionId: string;
  fromStatus: MissionStatus;
  toStatus: MissionStatus;
  highRisk?: boolean;
  dualApproval?: boolean;
}): Promise<{ allowed: boolean; reason: string }> {
  return evaluateMissionTransition(params);
}
