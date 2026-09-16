export type HealthStatus = 'ok';

export interface HealthResponse {
  status: HealthStatus;
}

/** Payload stored inside every signed JWT. */
export interface AuthPayload {
  sub: number;
  username: string;
}

/** Shape of the object attached to req.user by the requireAuth middleware. */
export interface AuthenticatedUser {
  id: number;
  username: string;
}