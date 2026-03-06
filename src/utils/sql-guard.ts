const READ_ONLY_PREFIXES = ["SELECT", "WITH", "EXPLAIN"];
const WRITE_PREFIXES = ["INSERT", "UPDATE", "DELETE", "MERGE"];
const DDL_PREFIXES = [
  "CREATE",
  "ALTER",
  "DROP",
  "TRUNCATE",
  "RENAME",
  "COMMENT",
  "GRANT",
  "REVOKE",
];

function getFirstKeyword(sql: string): string {
  return sql.trimStart().split(/\s+/)[0].toUpperCase();
}

export function isReadOnlySQL(sql: string): boolean {
  const keyword = getFirstKeyword(sql);
  return READ_ONLY_PREFIXES.includes(keyword);
}

export function isWriteSQL(sql: string): boolean {
  const keyword = getFirstKeyword(sql);
  return WRITE_PREFIXES.includes(keyword);
}

export function isDDL(sql: string): boolean {
  const keyword = getFirstKeyword(sql);
  return DDL_PREFIXES.includes(keyword);
}

export function classifySQL(sql: string): "read" | "write" | "ddl" | "unknown" {
  if (isReadOnlySQL(sql)) return "read";
  if (isWriteSQL(sql)) return "write";
  if (isDDL(sql)) return "ddl";
  return "unknown";
}
