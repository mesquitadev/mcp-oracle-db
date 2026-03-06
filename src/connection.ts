import oracledb from "oracledb";
import { OracleConfig } from "./utils/config.js";

let pool: oracledb.Pool | null = null;

export async function initPool(config: OracleConfig): Promise<void> {
  const poolAttrs: oracledb.PoolAttributes = {
    user: config.user,
    password: config.password,
    connectString: config.connectionString,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
  };

  if (config.tnsAdmin) {
    (poolAttrs as any).configDir = config.tnsAdmin;
  }

  if (config.walletLocation) {
    (poolAttrs as any).walletLocation = config.walletLocation;
  }

  pool = await oracledb.createPool(poolAttrs);
  console.error(`Oracle connection pool created (mode: ${config.mode})`);
}

export async function getConnection(): Promise<oracledb.Connection> {
  if (!pool) {
    throw new Error("Connection pool not initialized");
  }
  return pool.getConnection();
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close(0);
    pool = null;
  }
}
