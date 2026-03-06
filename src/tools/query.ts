import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import oracledb from "oracledb";
import { getConnection } from "../connection.js";
import { isReadOnlySQL } from "../utils/sql-guard.js";
import { OracleConfig } from "../utils/config.js";

export function registerQueryTools(server: McpServer, config: OracleConfig): void {
  server.registerTool("query", {
    title: "Execute Query",
    description: "Execute a SELECT query against the Oracle database. Returns results as JSON.",
    inputSchema: z.object({
      sql: z.string().describe("SQL SELECT query to execute"),
      binds: z.record(z.union([z.string(), z.number()])).optional().describe("Bind variables as key-value pairs"),
      max_rows: z.number().optional().describe("Maximum number of rows to return"),
    }),
  }, async ({ sql, binds, max_rows }) => {
    if (!isReadOnlySQL(sql)) {
      return {
        content: [{ type: "text" as const, text: "Error: Only SELECT/WITH queries are allowed. Use 'execute' or 'ddl' tools for write operations." }],
        isError: true,
      };
    }

    const conn = await getConnection();
    try {
      const result = await conn.execute(sql, binds || {}, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        maxRows: max_rows || config.maxRows,
      });

      const response = {
        columns: result.metaData?.map((col) => col.name),
        rows: result.rows,
        rowCount: (result.rows as any[])?.length || 0,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
      };
    } finally {
      await conn.close();
    }
  });
}
