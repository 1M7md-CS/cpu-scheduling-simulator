export type User = {
  email: string;
  passwordHash: string;
  createdAt: number;
};

export type AuthResult = {
  success: boolean;
  message: string;
};
