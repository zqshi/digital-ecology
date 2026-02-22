import type { MissionStatus, AcceptanceInput } from "./types";

const VALID_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  SUBMITTED: ["CONTRACTED"],
  CONTRACTED: ["ALLOCATING"],
  ALLOCATING: ["EXECUTING"],
  EXECUTING: ["DELIVERED"],
  DELIVERED: ["ACCEPTED", "REWORK_REQUIRED", "DISPUTED"],
  ACCEPTED: ["SETTLED"],
  REWORK_REQUIRED: ["EXECUTING"],
  DISPUTED: ["EXECUTING", "ACCEPTED"],
  SETTLED: [],
};

export function canTransition(from: MissionStatus, to: MissionStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function statusFromAcceptance(input: AcceptanceInput): MissionStatus {
  switch (input.decision) {
    case "ACCEPT":
      return "ACCEPTED";
    case "REWORK":
      return "REWORK_REQUIRED";
    case "DISPUTE":
      return "DISPUTED";
    default:
      return "DISPUTED";
  }
}
