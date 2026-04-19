export interface OracleConfig {
  user: string;
  password: string;
  connectionString: string;
  tnsAdmin?: string;
  walletLocation?: string;
  mode: "readonly" | "readwrite";
  maxRows: number;
}

export type ConfigResult =
  | { ok: true; config: OracleConfig }
  | { ok: false; missingVars: string[]; message: string };

export const SETUP_INSTRUCTIONS = `
=== mcp-oracle-db: Configuration Required ===

This MCP server requires environment variables to connect to Oracle Database.

Required variables:
  ORACLE_USER                 Database user (e.g. SYSTEM)
  ORACLE_PASSWORD             User password
  ORACLE_CONNECTION_STRING    Connection string (e.g. localhost:1521/XEPDB1)

Optional variables:
  ORACLE_TNS_ADMIN            Path to TNS admin directory (tnsnames.ora)
  ORACLE_WALLET_LOCATION      Path to Oracle Wallet (for Autonomous DB connections)
  ORACLE_MODE                 readonly (default) or readwrite
  ORACLE_MAX_ROWS             Max rows per query result (default: 1000)

Configuration example for Claude Code / Claude Desktop (settings.json or claude_desktop_config.json):

{
  "mcpServers": {
    "oracle": {
      "command": "node",
      "args": ["/path/to/mcp-oracle-db/dist/index.js"],
      "env": {
        "ORACLE_USER": "SYSTEM",
        "ORACLE_PASSWORD": "your_password",
        "ORACLE_CONNECTION_STRING": "localhost:1521/XEPDB1",
        "ORACLE_MODE": "readonly"
      }
    }
  }
}

For Oracle Autonomous Database (wallet) connections:

{
  "mcpServers": {
    "oracle": {
      "command": "node",
      "args": ["/path/to/mcp-oracle-db/dist/index.js"],
      "env": {
        "ORACLE_USER": "ADMIN",
        "ORACLE_PASSWORD": "your_password",
        "ORACLE_CONNECTION_STRING": "mydb_tp",
        "ORACLE_TNS_ADMIN": "/path/to/wallet",
        "ORACLE_WALLET_LOCATION": "/path/to/wallet",
        "ORACLE_MODE": "readonly"
      }
    }
  }
}
`.trim();

export function loadConfig(): ConfigResult {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectionString = process.env.ORACLE_CONNECTION_STRING;

  const missingVars: string[] = [];
  if (!user) missingVars.push("ORACLE_USER");
  if (!password) missingVars.push("ORACLE_PASSWORD");
  if (!connectionString) missingVars.push("ORACLE_CONNECTION_STRING");

  if (missingVars.length > 0) {
    return {
      ok: false,
      missingVars,
      message: `Missing environment variables: ${missingVars.join(", ")}\n\n${SETUP_INSTRUCTIONS}`,
    };
  }

  const rawMode = process.env.ORACLE_MODE?.toLowerCase();
  const mode: "readonly" | "readwrite" =
    rawMode === "readwrite" ? "readwrite" : "readonly";

  const maxRows = parseInt(process.env.ORACLE_MAX_ROWS || "1000", 10);

  return {
    ok: true,
    config: {
      user: user!,
      password: password!,
      connectionString: connectionString!,
      tnsAdmin: process.env.ORACLE_TNS_ADMIN,
      walletLocation: process.env.ORACLE_WALLET_LOCATION,
      mode,
      maxRows: isNaN(maxRows) ? 1000 : maxRows,
    },
  };
}
