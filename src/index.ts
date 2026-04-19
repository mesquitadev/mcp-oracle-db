#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./utils/config.js";
import { initPool, closePool } from "./connection.js";
import { registerExplorationTools } from "./tools/exploration.js";
import { registerQueryTools } from "./tools/query.js";
import { registerWriteTools } from "./tools/write.js";
import { registerDBATools } from "./tools/dba.js";
import { registerUnconfiguredTool } from "./tools/unconfigured.js";

async function main() {
  const result = loadConfig();

  const server = new McpServer({
    name: "mcp-oracle-db",
    version: "1.0.0",
    description: result.ok
      ? `Oracle MCP server connected (mode: ${result.config.mode}). Use the available tools to explore schemas, run queries, and manage the database.`
      : "Oracle MCP server - NOT CONFIGURED. Use the oracle_setup tool to see setup instructions.",
  });

  if (!result.ok) {
    console.error(`mcp-oracle-db: missing environment variables: ${result.missingVars.join(", ")}`);
    registerUnconfiguredTool(server, result.message);
  } else {
    registerExplorationTools(server);
    registerQueryTools(server, result.config);
    registerWriteTools(server, result.config);
    registerDBATools(server);

    await initPool(result.config);
    console.error("MCP Oracle DB server running on stdio");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on("SIGINT", async () => {
    await closePool();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await closePool();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
