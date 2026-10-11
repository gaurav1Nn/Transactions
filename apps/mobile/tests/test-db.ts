export function resolveTestDatabaseUrl(
  environment: Readonly<Record<string, string | undefined>>
): string {
  const databaseUrl = environment.TEST_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for mobile end-to-end tests");
  }

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `TEST_DATABASE_URL database name must end with '_test', got '${databaseName}'`
    );
  }

  return databaseUrl;
}
