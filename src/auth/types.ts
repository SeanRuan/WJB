export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  role: string;
};
