export interface OracleConfig {
  user: string;
  password: string;
  connectionString: string;
  tnsAdmin?: string;
  walletLocation?: string;
  mode: "readonly" | "readwrite";
  maxRows: number;
}

export function loadConfig(): OracleConfig {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectionString = process.env.ORACLE_CONNECTION_STRING;

  if (!user || !password || !connectionString) {
    throw new Error(
      "Missing required environment variables: ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECTION_STRING"
    );
  }

  const rawMode = process.env.ORACLE_MODE?.toLowerCase();
  const mode: "readonly" | "readwrite" =
    rawMode === "readwrite" ? "readwrite" : "readonly";

  const maxRows = parseInt(process.env.ORACLE_MAX_ROWS || "1000", 10);

  return {
    user,
    password,
    connectionString,
    tnsAdmin: process.env.ORACLE_TNS_ADMIN,
    walletLocation: process.env.ORACLE_WALLET_LOCATION,
    mode,
    maxRows: isNaN(maxRows) ? 1000 : maxRows,
  };
}
