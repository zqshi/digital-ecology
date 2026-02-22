export type MissionStatus =
  | "SUBMITTED"
  | "CONTRACTED"
  | "ALLOCATING"
  | "EXECUTING"
  | "DELIVERED"
  | "ACCEPTED"
  | "REWORK_REQUIRED"
  | "DISPUTED"
  | "SETTLED";

export interface HumanMission {
  missionId: string;
  title: string;
  objective: string;
  constraints: string[];
  requesterId: string;
  budgetCap: number;
  deadline: string;
  deliveryFormat: string;
  acceptanceCriteria: string[];
  status: MissionStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface AcceptanceInput {
  decision: "ACCEPT" | "REWORK" | "DISPUTE";
  comments?: string;
  reviewerId: string;
}
