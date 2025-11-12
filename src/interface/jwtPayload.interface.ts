// src/interfaces/jwtPayload.interface.ts
export interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}
