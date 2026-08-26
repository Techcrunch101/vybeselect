export interface Application {
  id: string;
  reference: string;
  opportunity_id: string | null;
  full_name: string;
  dj_name: string;
  gender: string | null;
  age: number | null;
  location: string | null;
  phone: string | null;
  email: string;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  other_social: string | null;
  years_experience: string | null;
  genres: string[];
  style: string | null;
  performed_professionally: boolean;
  previous_venues: string | null;
  equipment: string | null;
  why_select: string | null;
  video_type: string | null;
  video_url: string | null;
  video_file_path: string | null;
  status: string;
  rating: number;
  tags: string[];
  created_at: string;
}

export interface AdminNote {
  id: string;
  application_id: string;
  content: string;
  created_at: string;
}
