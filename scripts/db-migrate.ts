import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pool } from "../libs/platform/src/db";

async function main() {
  const sql = readFileSync(resolve(process.cwd(), "data/migrations/001_init.sql"), "utf-8");
  await pool.query(sql);
  await pool.end();
  console.log("db migration applied");
}

main().catch((err) => {
  console.error("db migration failed", err);
  process.exit(1);
});
