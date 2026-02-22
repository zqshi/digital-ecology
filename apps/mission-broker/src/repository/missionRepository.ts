import type { HumanMission } from "../domain/types";
import { query } from "../../../../libs/platform/src/db";

export interface MissionRepository {
  save(mission: HumanMission): Promise<void>;
  findById(missionId: string): Promise<HumanMission | undefined>;
}

export class PostgresMissionRepository implements MissionRepository {
  async save(mission: HumanMission): Promise<void> {
    await query(
      `
      INSERT INTO missions (
        mission_id, title, objective, requester_id, budget_cap, deadline,
        acceptance_criteria, constraints, delivery_format, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12)
      ON CONFLICT (mission_id) DO UPDATE SET
        title = EXCLUDED.title,
        objective = EXCLUDED.objective,
        requester_id = EXCLUDED.requester_id,
        budget_cap = EXCLUDED.budget_cap,
        deadline = EXCLUDED.deadline,
        acceptance_criteria = EXCLUDED.acceptance_criteria,
        constraints = EXCLUDED.constraints,
        delivery_format = EXCLUDED.delivery_format,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
      `,
      [
        mission.missionId,
        mission.title,
        mission.objective,
        mission.requesterId,
        mission.budgetCap,
        mission.deadline,
        JSON.stringify(mission.acceptanceCriteria),
        JSON.stringify(mission.constraints),
        mission.deliveryFormat,
        mission.status,
        mission.createdAt,
        mission.updatedAt || mission.createdAt,
      ]
    );
  }

  async findById(missionId: string): Promise<HumanMission | undefined> {
    const rows = await query<{
      mission_id: string;
      title: string;
      objective: string;
      requester_id: string;
      budget_cap: string;
      deadline: string;
      acceptance_criteria: string[];
      constraints: string[];
      delivery_format: string;
      status: HumanMission["status"];
      created_at: string;
      updated_at: string;
    }>(`SELECT * FROM missions WHERE mission_id = $1 LIMIT 1`, [missionId]);

    const row = rows[0];
    if (!row) return undefined;

    return {
      missionId: row.mission_id,
      title: row.title,
      objective: row.objective,
      requesterId: row.requester_id,
      budgetCap: Number(row.budget_cap),
      deadline: new Date(row.deadline).toISOString(),
      acceptanceCriteria: row.acceptance_criteria || [],
      constraints: row.constraints || [],
      deliveryFormat: row.delivery_format,
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}
