import type { AcceptanceInput, HumanMission, MissionStatus } from "../domain/types";
import { canTransition, statusFromAcceptance } from "../domain/stateMachine";
import { PostgresMissionRepository, type MissionRepository } from "../repository/missionRepository";

const repository: MissionRepository = new PostgresMissionRepository();

export async function createMission(
  input: Omit<HumanMission, "status" | "createdAt" | "updatedAt">
): Promise<HumanMission> {
  const now = new Date().toISOString();
  const mission: HumanMission = {
    ...input,
    status: "SUBMITTED",
    createdAt: now,
    updatedAt: now,
  };
  await repository.save(mission);
  return mission;
}

export async function getMission(missionId: string): Promise<HumanMission | undefined> {
  return repository.findById(missionId);
}

export async function transitionMission(missionId: string, nextStatus: MissionStatus): Promise<HumanMission> {
  const mission = await repository.findById(missionId);
  if (!mission) {
    throw new Error("MISSION_NOT_FOUND");
  }
  if (!canTransition(mission.status, nextStatus)) {
    throw new Error("INVALID_STATE_TRANSITION");
  }
  mission.status = nextStatus;
  mission.updatedAt = new Date().toISOString();
  await repository.save(mission);
  return mission;
}

export async function applyAcceptance(missionId: string, input: AcceptanceInput): Promise<HumanMission> {
  const nextStatus = statusFromAcceptance(input);
  return transitionMission(missionId, nextStatus);
}
