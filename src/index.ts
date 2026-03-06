#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./utils/config.js";
import { initPool, closePool } from "./connection.js";
import { registerExplorationTools } from "./tools/exploration.js";
import { registerQueryTools } from "./tools/query.js";
import { registerWriteTools } from "./tools/write.js";
import { registerDBATools } from "./tools/dba.js";

async function main() {
  const config = loadConfig();

  const server = new McpServer({
    name: "mcp-oracle-db",
    version: "1.0.0",
  });

  registerExplorationTools(server);
  registerQueryTools(server, config);
  registerWriteTools(server, config);
  registerDBATools(server);

  await initPool(config);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Oracle DB server running on stdio");

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
