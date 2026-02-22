import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import {
  applyAcceptance,
  createMission,
  getMission,
  transitionMission,
} from "../application/missionService";
import { emitAudit } from "../adapters/auditClient";
import { checkTransitionPolicy } from "../adapters/policyClient";
import type { MissionStatus } from "../domain/types";

function json(res: any, statusCode: number, body: Record<string, unknown>) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readBody(req: any): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf-8");
  return raw ? JSON.parse(raw) : {};
}

function badRequest(res: any, code: string, message: string) {
  return json(res, 400, { code, message });
}

function validateCreateMission(body: any): string | null {
  if (!body || typeof body !== "object") return "request body must be an object";
  if (!body.title || typeof body.title !== "string") return "title is required";
  if (!body.objective || typeof body.objective !== "string") return "objective is required";
  if (!(body.requesterId || body.requester_id)) return "requesterId is required";
  const budget = body.budgetCap ?? body.budget_cap;
  if (typeof budget !== "number" || budget < 0) return "budgetCap must be a non-negative number";
  if (!body.deadline || typeof body.deadline !== "string") return "deadline is required";
  const criteria = body.acceptanceCriteria || body.acceptance_criteria;
  if (!Array.isArray(criteria) || criteria.length === 0) return "acceptanceCriteria must be a non-empty array";
  return null;
}

function validateAcceptance(body: any): string | null {
  if (!body || typeof body !== "object") return "request body must be an object";
  if (!["ACCEPT", "REWORK", "DISPUTE"].includes(body.decision)) return "decision must be ACCEPT|REWORK|DISPUTE";
  if (!body.reviewerId || typeof body.reviewerId !== "string") return "reviewerId is required";
  return null;
}

function validateTransition(body: any): string | null {
  const allowed = [
    "CONTRACTED",
    "ALLOCATING",
    "EXECUTING",
    "DELIVERED",
    "ACCEPTED",
    "REWORK_REQUIRED",
    "DISPUTED",
    "SETTLED",
  ];
  if (!body || typeof body !== "object") return "request body must be an object";
  if (!body.toStatus || !allowed.includes(body.toStatus)) return "toStatus is invalid";
  if (!body.actorId || typeof body.actorId !== "string") return "actorId is required";
  return null;
}

export function startMissionBrokerServer(port = 8081) {
  const host = process.env.HOST || "127.0.0.1";
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const traceId = (req.headers["x-trace-id"] as string) || randomUUID();

    try {
      if (req.method === "GET" && url.pathname === "/v1/health") {
        return json(res, 200, { status: "ok", service: "mission-broker" });
      }

      if (req.method === "POST" && url.pathname === "/v1/missions") {
        const body = await readBody(req);
        const validationError = validateCreateMission(body);
        if (validationError) {
          return badRequest(res, "MBR_400_INVALID_REQUEST", validationError);
        }

        const missionId = randomUUID();
        const mission = await createMission({
          missionId,
          title: body.title,
          objective: body.objective,
          requesterId: body.requesterId ?? body.requester_id,
          budgetCap: body.budgetCap ?? body.budget_cap,
          deadline: body.deadline,
          acceptanceCriteria: body.acceptanceCriteria || body.acceptance_criteria || [],
          constraints: body.constraints || [],
          deliveryFormat: body.deliveryFormat || body.delivery_format || "REPORT",
        });

        await emitAudit({
          actorId: body.requesterId || "unknown",
          action: "MISSION_CREATE",
          resource: `mission/${missionId}`,
          traceId,
          result: "SUCCESS",
          payload: { status: mission.status },
        });

        return json(res, 201, { missionId, status: mission.status, traceId });
      }

      if (req.method === "GET" && url.pathname.startsWith("/v1/missions/")) {
        const missionId = url.pathname.split("/")[3];
        const mission = await getMission(missionId);
        if (!mission) {
          return json(res, 404, { code: "MBR_404_MISSION_NOT_FOUND" });
        }
        return json(res, 200, {
          missionId: mission.missionId,
          status: mission.status,
          updatedAt: mission.updatedAt,
        });
      }

      if (req.method === "POST" && url.pathname.match(/^\/v1\/missions\/[^/]+\/acceptance$/)) {
        const missionId = url.pathname.split("/")[3];
        const body = await readBody(req);
        const validationError = validateAcceptance(body);
        if (validationError) {
          return badRequest(res, "MBR_400_INVALID_REQUEST", validationError);
        }

        const current = await getMission(missionId);
        if (!current) {
          return json(res, 404, { code: "MBR_404_MISSION_NOT_FOUND" });
        }
        const desired =
          body.decision === "ACCEPT"
            ? "ACCEPTED"
            : body.decision === "REWORK"
            ? "REWORK_REQUIRED"
            : "DISPUTED";

        const decision = await checkTransitionPolicy({
          actorId: body.reviewerId || "unknown",
          missionId,
          fromStatus: current.status,
          toStatus: desired,
          highRisk: body.decision === "DISPUTE",
          dualApproval: Boolean(body.dualApproval),
        });

        if (!decision.allowed) {
          await emitAudit({
            actorId: body.reviewerId || "unknown",
            action: "MISSION_ACCEPTANCE_DENY",
            resource: `mission/${missionId}`,
            traceId,
            result: "DENY",
            payload: { reason: decision.reason },
          });
          return json(res, 403, { code: "MBR_403_POLICY_DENIED", reason: decision.reason });
        }

        const mission = await applyAcceptance(missionId, {
          decision: body.decision,
          comments: body.comments,
          reviewerId: body.reviewerId,
        });

        if (mission.status === "ACCEPTED") {
          await transitionMission(missionId, "SETTLED");
        }

        await emitAudit({
          actorId: body.reviewerId || "unknown",
          action: "MISSION_ACCEPTANCE",
          resource: `mission/${missionId}`,
          traceId,
          result: "SUCCESS",
          payload: { decision: body.decision, status: mission.status },
        });

        return json(res, 200, {
          missionId,
          status: mission.status,
          nextAction: mission.status === "REWORK_REQUIRED" ? "REWORK" : "NONE",
        });
      }

      if (req.method === "POST" && url.pathname.match(/^\/v1\/missions\/[^/]+\/transition$/)) {
        const missionId = url.pathname.split("/")[3];
        const body = await readBody(req);
        const validationError = validateTransition(body);
        if (validationError) {
          return badRequest(res, "MBR_400_INVALID_REQUEST", validationError);
        }

        const current = await getMission(missionId);
        if (!current) {
          return json(res, 404, { code: "MBR_404_MISSION_NOT_FOUND" });
        }

        const decision = await checkTransitionPolicy({
          actorId: body.actorId,
          missionId,
          fromStatus: current.status,
          toStatus: body.toStatus as MissionStatus,
          highRisk: Boolean(body.highRisk),
          dualApproval: Boolean(body.dualApproval),
        });
        if (!decision.allowed) {
          await emitAudit({
            actorId: body.actorId,
            action: "MISSION_TRANSITION_DENY",
            resource: `mission/${missionId}`,
            traceId,
            result: "DENY",
            payload: { reason: decision.reason, from: current.status, to: body.toStatus },
          });
          return json(res, 403, { code: "MBR_403_POLICY_DENIED", reason: decision.reason });
        }

        const mission = await transitionMission(missionId, body.toStatus as MissionStatus);
        await emitAudit({
          actorId: body.actorId,
          action: "MISSION_TRANSITION",
          resource: `mission/${missionId}`,
          traceId,
          result: "SUCCESS",
          payload: { status: mission.status },
        });
        return json(res, 200, { missionId, status: mission.status });
      }

      return json(res, 404, { code: "MBR_404_NOT_FOUND" });
    } catch (err: any) {
      return json(res, 500, { code: "MBR_500_INTERNAL_ERROR", error: err?.message || "unknown" });
    }
  });

  server.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`[mission-broker] listening on ${host}:${port}`);
  });

  return server;
}
