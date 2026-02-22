import type { AcceptanceInput } from "../domain/types";

export interface CreateMissionRequest {
  title: string;
  objective: string;
  constraints: string[];
  budgetCap: number;
  deadline: string;
  deliveryFormat: string;
  acceptanceCriteria: string[];
  requesterId: string;
}

export interface CreateMissionResponse {
  missionId: string;
  status: "SUBMITTED";
  traceId: string;
}

export interface MissionStatusResponse {
  missionId: string;
  status: string;
  allocationSummary?: Record<string, unknown>;
  deliverySummary?: Record<string, unknown>;
  updatedAt?: string;
}

export type AcceptanceRequest = AcceptanceInput;
