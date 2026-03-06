import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import oracledb from "oracledb";
import { getConnection } from "../connection.js";

export function registerExplorationTools(server: McpServer): void {
  server.registerTool("list_schemas", {
    title: "List Schemas",
    description: "List all accessible schemas in the Oracle database",
    inputSchema: z.object({}),
  }, async () => {
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        `SELECT username FROM all_users ORDER BY username`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const schemas = (result.rows as any[]).map((r) => r.USERNAME);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(schemas, null, 2) }],
      };
    } finally {
      await conn.close();
    }
  });

  server.registerTool("list_tables", {
    title: "List Tables",
    description: "List all tables and views in a schema",
    inputSchema: z.object({
      schema: z.string().describe("Schema/owner name"),
    }),
  }, async ({ schema }) => {
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        `SELECT object_name, object_type
         FROM all_objects
         WHERE owner = :owner AND object_type IN ('TABLE', 'VIEW')
         ORDER BY object_type, object_name`,
        { owner: schema.toUpperCase() },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result.rows, null, 2) }],
      };
    } finally {
      await conn.close();
    }
  });

  server.registerTool("describe_table", {
    title: "Describe Table",
    description: "Show columns, types, primary keys, foreign keys, and indexes for a table",
    inputSchema: z.object({
      schema: z.string().describe("Schema/owner name"),
      table: z.string().describe("Table name"),
    }),
  }, async ({ schema, table }) => {
    const conn = await getConnection();
    const owner = schema.toUpperCase();
    const tableName = table.toUpperCase();
    try {
      const columns = await conn.execute(
        `SELECT column_name, data_type, data_length, data_precision, data_scale, nullable
         FROM all_tab_columns
         WHERE owner = :owner AND table_name = :table_name
         ORDER BY column_id`,
        { owner, table_name: tableName },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const pks = await conn.execute(
        `SELECT cols.column_name
         FROM all_constraints cons
         JOIN all_cons_columns cols ON cons.constraint_name = cols.constraint_name AND cons.owner = cols.owner
         WHERE cons.owner = :owner AND cons.table_name = :table_name AND cons.constraint_type = 'P'
         ORDER BY cols.position`,
        { owner, table_name: tableName },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const fks = await conn.execute(
        `SELECT cols.column_name, r_cons.table_name AS ref_table, r_cols.column_name AS ref_column
         FROM all_constraints cons
         JOIN all_cons_columns cols ON cons.constraint_name = cols.constraint_name AND cons.owner = cols.owner
         JOIN all_constraints r_cons ON cons.r_constraint_name = r_cons.constraint_name AND cons.r_owner = r_cons.owner
         JOIN all_cons_columns r_cols ON r_cons.constraint_name = r_cols.constraint_name AND r_cons.owner = r_cols.owner AND cols.position = r_cols.position
         WHERE cons.owner = :owner AND cons.table_name = :table_name AND cons.constraint_type = 'R'`,
        { owner, table_name: tableName },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const indexes = await conn.execute(
        `SELECT i.index_name, i.uniqueness, LISTAGG(ic.column_name, ', ') WITHIN GROUP (ORDER BY ic.column_position) AS columns
         FROM all_indexes i
         JOIN all_ind_columns ic ON i.index_name = ic.index_name AND i.owner = ic.index_owner
         WHERE i.owner = :owner AND i.table_name = :table_name
         GROUP BY i.index_name, i.uniqueness`,
        { owner, table_name: tableName },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const description = {
        columns: columns.rows,
        primaryKeys: (pks.rows as any[]).map((r) => r.COLUMN_NAME),
        foreignKeys: fks.rows,
        indexes: indexes.rows,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(description, null, 2) }],
      };
    } finally {
      await conn.close();
    }
  });
}
