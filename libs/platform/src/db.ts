import { Pool } from "pg";
import { config } from "./config";

export const pool = new Pool({ connectionString: config.dbUrl });

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(sql, params);
  return res.rows as T[];
}
