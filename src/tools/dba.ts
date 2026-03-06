import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import oracledb from "oracledb";
import { getConnection } from "../connection.js";

export function registerDBATools(server: McpServer): void {
  server.registerTool("explain_plan", {
    title: "Explain Plan",
    description: "Generate execution plan for a SQL query",
    inputSchema: z.object({
      sql: z.string().describe("SQL query to analyze"),
    }),
  }, async ({ sql }) => {
    const conn = await getConnection();
    try {
      await conn.execute(`EXPLAIN PLAN FOR ${sql}`);
      const result = await conn.execute(
        `SELECT plan_table_output FROM TABLE(DBMS_XPLAN.DISPLAY('PLAN_TABLE', NULL, 'ALL'))`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const planLines = (result.rows as any[]).map((r) => r.PLAN_TABLE_OUTPUT);
      return {
        content: [{ type: "text" as const, text: planLines.join("\n") }],
      };
    } finally {
      await conn.close();
    }
  });

  server.registerTool("session_info", {
    title: "Session Info",
    description: "Get information about the current database session",
    inputSchema: z.object({}),
  }, async () => {
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        `SELECT sid, serial#, username, status, osuser, machine, program, logon_time,
                (SELECT name FROM v$database) AS db_name,
                (SELECT version FROM v$instance) AS db_version
         FROM v$session WHERE sid = SYS_CONTEXT('USERENV', 'SID')`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result.rows?.[0] || {}, null, 2) }],
      };
    } finally {
      await conn.close();
    }
  });

  server.registerTool("active_sessions", {
    title: "Active Sessions",
    description: "List active sessions in the Oracle database (V$SESSION)",
    inputSchema: z.object({}),
  }, async () => {
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        `SELECT sid, serial#, username, status, osuser, machine, program,
                sql_id, event, wait_class, seconds_in_wait, logon_time
         FROM v$session
         WHERE type = 'USER' AND status = 'ACTIVE'
         ORDER BY logon_time`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result.rows, null, 2) }],
      };
    } finally {
      await conn.close();
    }
  });

  server.registerTool("locks", {
    title: "Database Locks",
    description: "Show active locks and blocking sessions",
    inputSchema: z.object({}),
  }, async () => {
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        `SELECT
           l.sid AS holding_sid,
           s.username AS holding_user,
           s.program AS holding_program,
           l.type AS lock_type,
           l.lmode AS lock_mode,
           l.request,
           o.object_name,
           o.object_type,
           bl.sid AS blocked_sid
         FROM v$lock l
         JOIN v$session s ON l.sid = s.sid
         LEFT JOIN dba_objects o ON l.id1 = o.object_id
         LEFT JOIN v$lock bl ON l.id1 = bl.id1 AND l.id2 = bl.id2 AND bl.request > 0 AND l.lmode > 0
         WHERE l.lmode > 0 OR l.request > 0
         ORDER BY l.sid`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result.rows, null, 2) }],
      };
    } finally {
      await conn.close();
    }
  });
}
