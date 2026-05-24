export type User = {
  email: string;
  passwordHash: string;
  createdAt: number;
  attempts: number;
  blockedUntil: number | null;
};

export type AuthResult = {
  success: boolean;
  message: string;
};
