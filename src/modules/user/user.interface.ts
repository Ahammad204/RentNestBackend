export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: "TENANT" | "LANDLORD" | "ADMIN";
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  bio?: string;
}
