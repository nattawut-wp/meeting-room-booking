function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const config = {
  databaseUrl: required("DATABASE_URL"),
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
};
