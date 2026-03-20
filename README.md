# mcp-oracle-db

An [MCP](https://modelcontextprotocol.io) (Model Context Protocol) server for **Oracle Database**.

Lets AI assistants explore your database schema, run queries, write data, and monitor sessions — all through natural language.

Works with Claude Desktop, Claude Code, Cursor, Windsurf, and any MCP-compatible client.

## Features

- **Explore** — list schemas, tables, columns, indexes, constraints
- **Query** — execute SELECT with bind variables
- **Write** — INSERT, UPDATE, DELETE, MERGE, DDL (opt-in)
- **Monitor** — explain plans, active sessions, locks
- **Safe** — read-only by default, write requires explicit opt-in
- **Zero install** — Oracle Thin mode, no Oracle Client needed
- **Connection pooling** — efficient resource usage

## Quick Start

```bash
npx mcp-oracle-db
```

Or install globally:

```bash
npm install -g mcp-oracle-db
```

## Configuration

Set these environment variables:

| Variable | Required | Default | Description |
|---|---|---|---|
| `ORACLE_USER` | Yes | — | Database username |
| `ORACLE_PASSWORD` | Yes | — | Database password |
| `ORACLE_CONNECTION_STRING` | Yes | — | `host:port/service` or TNS alias |
| `ORACLE_MODE` | No | `readonly` | `readonly` or `readwrite` |
| `ORACLE_MAX_ROWS` | No | `1000` | Max rows per query |
| `ORACLE_TNS_ADMIN` | No | — | Path to `tnsnames.ora` directory |
| `ORACLE_WALLET_LOCATION` | No | — | Path to Oracle Wallet (for cloud DBs) |

### Connection string formats

```bash
# Standard
ORACLE_CONNECTION_STRING=myhost:1521/myservice

# TNS alias
ORACLE_CONNECTION_STRING=MY_TNS_ALIAS
ORACLE_TNS_ADMIN=/path/to/tns_admin

# Oracle Cloud / Autonomous DB (wallet)
ORACLE_CONNECTION_STRING=myatp_high
ORACLE_TNS_ADMIN=/path/to/wallet
ORACLE_WALLET_LOCATION=/path/to/wallet
```

## Setup

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "oracle": {
      "command": "npx",
      "args": ["-y", "mcp-oracle-db"],
      "env": {
        "ORACLE_USER": "your_user",
        "ORACLE_PASSWORD": "your_password",
        "ORACLE_CONNECTION_STRING": "your_host:1521/your_service"
      }
    }
  }
}
```

### Claude Code

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "oracle": {
      "command": "npx",
      "args": ["-y", "mcp-oracle-db"],
      "env": {
        "ORACLE_USER": "your_user",
        "ORACLE_PASSWORD": "your_password",
        "ORACLE_CONNECTION_STRING": "your_host:1521/your_service"
      }
    }
  }
}
```

### Cursor / Windsurf

Same format as Claude Code — add to your MCP settings with the env vars above.

## Tools

### Exploration

| Tool | Description |
|---|---|
| `list_schemas` | List all accessible schemas |
| `list_tables` | List tables and views in a schema |
| `describe_table` | Columns, PKs, FKs, indexes of a table |

### Query

| Tool | Description |
|---|---|
| `query` | Run SELECT queries (supports bind variables) |

### Write *(requires `ORACLE_MODE=readwrite`)*

| Tool | Description |
|---|---|
| `execute` | Run DML — INSERT, UPDATE, DELETE, MERGE |
| `ddl` | Run DDL — CREATE, ALTER, DROP, TRUNCATE |

### DBA / Monitoring

| Tool | Description |
|---|---|
| `explain_plan` | Execution plan for a query |
| `session_info` | Current session details |
| `active_sessions` | All active database sessions |
| `locks` | Active locks and blockers |

## Security

- **Read-only by default** — writes blocked unless `ORACLE_MODE=readwrite`
- **SQL validation** — `query` only accepts SELECT/WITH
- **Bind variables** — prevents SQL injection
- **No credentials in code** — everything via environment variables

## Requirements

- Node.js >= 18
- Oracle Database (any version)
- No Oracle Client installation needed

## License

MIT
