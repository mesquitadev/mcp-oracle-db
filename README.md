# mcp-oracle-db

An MCP (Model Context Protocol) server for Oracle Database. Provides exploration, query execution, write operations, and DBA monitoring tools.

Works with any MCP-compatible client (Claude Desktop, Claude Code, etc).

## Features

- Database exploration (schemas, tables, columns, indexes, constraints)
- SQL query execution with bind variable support
- DML operations (INSERT, UPDATE, DELETE, MERGE)
- DDL operations (CREATE, ALTER, DROP, etc)
- DBA monitoring (explain plans, sessions, locks)
- Read-only mode by default for safety
- Oracle Thin mode (no Oracle Client installation required)
- Connection pooling
- Supports simple connections, TNS, and Oracle Wallet

## Installation

```bash
npx mcp-oracle-db
```

Or install globally:
```bash
npm install -g mcp-oracle-db
```

## Configuration

All configuration is done via environment variables:

| Variable | Description | Required | Default |
|---|---|---|---|
| `ORACLE_USER` | Database username | Yes | - |
| `ORACLE_PASSWORD` | Database password | Yes | - |
| `ORACLE_CONNECTION_STRING` | Host:port/service_name or TNS alias | Yes | - |
| `ORACLE_TNS_ADMIN` | Path to directory containing tnsnames.ora | No | - |
| `ORACLE_WALLET_LOCATION` | Path to Oracle Wallet directory | No | - |
| `ORACLE_MODE` | `readonly` or `readwrite` | No | `readonly` |
| `ORACLE_MAX_ROWS` | Maximum rows returned by queries | No | `1000` |

### Connection Examples

**Simple connection:**
```
ORACLE_CONNECTION_STRING=localhost:1521/FREEPDB1
```

**TNS connection:**
```
ORACLE_CONNECTION_STRING=MYDB_ALIAS
ORACLE_TNS_ADMIN=/path/to/tns_admin
```

**Oracle Wallet (Cloud/Autonomous DB):**
```
ORACLE_CONNECTION_STRING=myatp_high
ORACLE_TNS_ADMIN=/path/to/wallet
ORACLE_WALLET_LOCATION=/path/to/wallet
```

## MCP Client Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "oracle": {
      "command": "npx",
      "args": ["-y", "mcp-oracle-db"],
      "env": {
        "ORACLE_USER": "hr",
        "ORACLE_PASSWORD": "your_password",
        "ORACLE_CONNECTION_STRING": "localhost:1521/FREEPDB1",
        "ORACLE_MODE": "readonly"
      }
    }
  }
}
```

### Claude Code

Add to your `.claude/settings.json`:

```json
{
  "mcpServers": {
    "oracle": {
      "command": "npx",
      "args": ["-y", "mcp-oracle-db"],
      "env": {
        "ORACLE_USER": "hr",
        "ORACLE_PASSWORD": "your_password",
        "ORACLE_CONNECTION_STRING": "localhost:1521/FREEPDB1",
        "ORACLE_MODE": "readonly"
      }
    }
  }
}
```

## Tools Reference

### Exploration

| Tool | Description | Parameters |
|---|---|---|
| `list_schemas` | List all accessible schemas | none |
| `list_tables` | List tables and views in a schema | `schema` |
| `describe_table` | Show columns, PKs, FKs, indexes | `schema`, `table` |

### Query

| Tool | Description | Parameters |
|---|---|---|
| `query` | Execute SELECT queries | `sql`, `binds?`, `max_rows?` |

### Write (requires ORACLE_MODE=readwrite)

| Tool | Description | Parameters |
|---|---|---|
| `execute` | Execute DML (INSERT/UPDATE/DELETE/MERGE) | `sql`, `binds?` |
| `ddl` | Execute DDL (CREATE/ALTER/DROP/etc) | `sql` |

### DBA / Monitoring

| Tool | Description | Parameters |
|---|---|---|
| `explain_plan` | Generate execution plan | `sql` |
| `session_info` | Current session information | none |
| `active_sessions` | List active database sessions | none |
| `locks` | Show active locks and blockers | none |

## Security

- **Read-only by default**: Write operations (`execute`, `ddl`) are blocked unless `ORACLE_MODE=readwrite`
- **SQL validation**: The `query` tool only accepts SELECT/WITH statements
- **Bind variables**: All tools support bind variables to prevent SQL injection
- **Connection pooling**: Efficient resource usage with configurable pool size

## Requirements

- Node.js >= 18
- Oracle Database (any supported version)
- No Oracle Client installation needed (uses Thin mode)

## License

MIT
