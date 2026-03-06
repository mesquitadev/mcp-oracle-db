import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getConnection } from "../connection.js";
import { isWriteSQL, isDDL } from "../utils/sql-guard.js";
import { OracleConfig } from "../utils/config.js";

function readOnlyError(): { content: { type: "text"; text: string }[]; isError: true } {
  return {
    content: [{ type: "text" as const, text: "Error: Write operations are disabled. Set ORACLE_MODE=readwrite to enable." }],
    isError: true,
  };
}

export function registerWriteTools(server: McpServer, config: OracleConfig): void {
  server.registerTool("execute", {
    title: "Execute DML",
    description: "Execute INSERT, UPDATE, DELETE, or MERGE statement. Requires ORACLE_MODE=readwrite. Auto-commits on success.",
    inputSchema: z.object({
      sql: z.string().describe("DML SQL statement (INSERT, UPDATE, DELETE, MERGE)"),
      binds: z.record(z.union([z.string(), z.number()])).optional().describe("Bind variables as key-value pairs"),
    }),
  }, async ({ sql, binds }) => {
    if (config.mode !== "readwrite") return readOnlyError();

    if (!isWriteSQL(sql)) {
      return {
        content: [{ type: "text" as const, text: "Error: Only INSERT, UPDATE, DELETE, MERGE statements are allowed. Use 'query' for SELECT or 'ddl' for DDL." }],
        isError: true,
      };
    }

    const conn = await getConnection();
    try {
      const result = await conn.execute(sql, binds || {}, { autoCommit: true });
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ rowsAffected: result.rowsAffected }, null, 2) }],
      };
    } finally {
      await conn.close();
    }
  });

  server.registerTool("ddl", {
    title: "Execute DDL",
    description: "Execute DDL statements (CREATE, ALTER, DROP, TRUNCATE, etc). Requires ORACLE_MODE=readwrite.",
    inputSchema: z.object({
      sql: z.string().describe("DDL SQL statement"),
    }),
  }, async ({ sql }) => {
    if (config.mode !== "readwrite") return readOnlyError();

    if (!isDDL(sql)) {
      return {
        content: [{ type: "text" as const, text: "Error: Only DDL statements (CREATE, ALTER, DROP, TRUNCATE, RENAME, GRANT, REVOKE) are allowed." }],
        isError: true,
      };
    }

    const conn = await getConnection();
    try {
      await conn.execute(sql);
      return {
        content: [{ type: "text" as const, text: `DDL executed successfully: ${sql.trimStart().split(/\s+/).slice(0, 3).join(" ")}...` }],
      };
    } finally {
      await conn.close();
    }
  });
}
