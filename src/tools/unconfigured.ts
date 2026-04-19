import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerUnconfiguredTool(server: McpServer, message: string): void {
  server.registerTool(
    "oracle_setup",
    {
      title: "Oracle Setup Required",
      description:
        "The Oracle MCP server is not configured. Call this tool to see the setup instructions.",
      inputSchema: z.object({}),
    },
    async () => {
      return {
        content: [{ type: "text" as const, text: message }],
        isError: true,
      };
    }
  );
}
