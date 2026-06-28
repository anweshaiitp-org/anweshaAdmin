export interface LoginResponse {
  success: boolean;
  message?: string;
  code?: string;

  token?: string;

  user?: {
    user_id: string;
    anwesha_id: string;
    email_id: string;
    full_name: string;
    role: string;
  };
}