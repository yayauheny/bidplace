export const e2eApiBaseURL =
  process.env.E2E_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

export const e2eWebBaseURL =
  process.env.E2E_WEB_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8081';

export const e2eDatabaseURL =
  process.env.E2E_DATABASE_URL ??
  'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e?schema=public';
