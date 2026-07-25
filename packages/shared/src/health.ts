/**
 * Response shape for `GET /health`. Defined once here and imported by both the
 * api (to build the response) and the web client (to read it) so the contract
 * is enforced on both sides.
 */
export interface HealthResponse {
  status: 'ok';
  service: 'rally-api';
  uptime: number;
  timestamp: string;
}
