import { createServer } from "node:http";
import { enforceTransitionPolicy } from "./pep";

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

export function startRuntimeGatewayServer(port = 8082) {
  const host = process.env.HOST || "127.0.0.1";
  const server = createServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/v1/health") {
        return json(res, 200, { status: "ok", service: "runtime-gateway" });
      }

      if (req.method === "POST" && req.url === "/v1/transition/check") {
        const body = await readBody(req);
        const actorFromHeader = req.headers["x-actor-id"];
        const actorHeader = Array.isArray(actorFromHeader) ? actorFromHeader[0] : actorFromHeader;
        if (!actorHeader || typeof actorHeader !== "string") {
          return json(res, 401, { code: "RTG_401_MISSING_ACTOR_HEADER" });
        }
        if (!body.actorId || body.actorId !== actorHeader) {
          return json(res, 403, { code: "RTG_403_ACTOR_MISMATCH" });
        }
        const decision = await enforceTransitionPolicy(body);
        return json(res, decision.allowed ? 200 : 403, decision);
      }
      return json(res, 404, { code: "RTG_404_NOT_FOUND" });
    } catch (err: any) {
      return json(res, 500, { code: "RTG_500_INTERNAL_ERROR", error: err?.message || "unknown" });
    }
  });

  server.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`[runtime-gateway] listening on ${host}:${port}`);
  });

  return server;
}
