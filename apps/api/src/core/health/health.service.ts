export type HealthStatus = {
  status: 'ok';
  timestamp: string;
};

export class HealthService {
  getStatus(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
