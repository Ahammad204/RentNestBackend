export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;   
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  bio?: string;
}