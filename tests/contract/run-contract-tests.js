const fs = require("node:fs");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function testSchemas() {
  const root = path.resolve(__dirname, "../../libs/event-schemas");
  const audit = readJson(path.join(root, "audit-event.v1.schema.json"));
  const mission = readJson(path.join(root, "human-mission.v1.schema.json"));
  const delivery = readJson(path.join(root, "delivery-package.v1.schema.json"));

  assert(audit.required.includes("trace_id"), "audit schema must require trace_id");
  assert(mission.properties.status.enum.includes("SETTLED"), "mission schema must include SETTLED status");
  assert(delivery.required.includes("evidence_refs"), "delivery schema must require evidence_refs");
}

function testApiSpec() {
  const specPath = path.resolve(__dirname, "../../docs/specs/mission-broker-api-v1.md");
  const spec = fs.readFileSync(specPath, "utf-8");
  assert(spec.includes("POST /v1/missions"), "API spec must define create mission endpoint");
  assert(spec.includes("POST /v1/missions/{mission_id}/acceptance"), "API spec must define acceptance endpoint");
}

function main() {
  testSchemas();
  testApiSpec();
  console.log("contract tests passed");
}

main();
