export interface UserProfile {
  user_id: string;
  anwesha_id: string;
  email_id: string;
  full_name: string;
  phone_number?: string;
  collage_name?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | string;
  role: string;
  is_profile_completed?: boolean;
  profile_photo?: string;
  dob?: string;
  instagram_id?: string;
  facebook_id?: string;
  accomadation_selected?: boolean;
}

export interface EditProfilePayload {
  full_name?: string;
  phone_number?: string;
  collage_name?: string;
  gender?: string;
  dob?: string;
  instagram_id?: string;
  facebook_id?: string;
  profile_photo?: string;
  accomadation_selected?: boolean;
}

export interface UploadUrlResponse {
  success: boolean;
  uploadUrl: string;
  fileKey: string;
  message?: string;
}

export interface PhotoUrlResponse {
  success: boolean;
  url: string;
  message?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}
