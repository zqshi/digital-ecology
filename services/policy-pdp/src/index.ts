import { config } from "../../../libs/platform/src/config";
import type { MissionStatus } from "../../../apps/mission-broker/src/domain/types";

export interface TransitionPolicyInput {
  actorId: string;
  missionId: string;
  fromStatus: MissionStatus;
  toStatus: MissionStatus;
  highRisk?: boolean;
  dualApproval?: boolean;
}

export interface TransitionPolicyDecision {
  allowed: boolean;
  reason: string;
}

export async function evaluateMissionTransition(input: TransitionPolicyInput): Promise<TransitionPolicyDecision> {
  try {
    const res = await fetch(config.opaUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input: {
          actorId: input.actorId,
          missionId: input.missionId,
          fromStatus: input.fromStatus,
          toStatus: input.toStatus,
          highRisk: Boolean(input.highRisk),
          dualApproval: Boolean(input.dualApproval),
        },
      }),
    });

    if (!res.ok) {
      return { allowed: false, reason: `OPA_HTTP_${res.status}` };
    }

    const body = (await res.json()) as { result?: boolean };
    if (body.result === true) {
      return { allowed: true, reason: "ALLOW" };
    }
    return { allowed: false, reason: "OPA_DENY" };
  } catch (err: any) {
    return { allowed: false, reason: `OPA_UNREACHABLE:${err?.message || "unknown"}` };
  }
}
