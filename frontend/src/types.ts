export type Badge = {
  id: string;
  slug: string;
  label: string;
  image_url: string;
};

export type User = {
  id: string;
  pseudo: string;
  email: string;
  role: "user" | "admin";
  bio?: string;
  internal_note?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  last_login_at?: string | null;
  discord_url?: string | null;
  x_url?: string | null;
  bluesky_url?: string | null;
  stoat_url?: string | null;
  youtube_url?: string | null;
  twitch_url?: string | null;
  kick_url?: string | null;
  snapchat_url?: string | null;
  tiktok_url?: string | null;
  badges?: Badge[];
  email_verified?: boolean;
  two_factor_enabled?: boolean;
  language?: string;
  customer_reference?: string;
};

export type Server = {
  id: string;
  reference_number: number;
  user_id: string;
  user_pseudo: string;
  user_avatar_url: string | null;
  category_id: string;
  category_slug: string;
  category_label: string;
  category_image_url: string | null;
  name: string;
  description: string;
  website: string | null;
  country_code: string;
  ip: string | null;
  port: number | null;
  invite_link: string | null;
  banner_url: string | null;
  verified: boolean;
  is_public: boolean;
  is_hidden: boolean;
  is_visible: boolean;
  created_at: string;
  premium_type: "quokka_plus" | "essentiel" | null;
  premium_end_date: string | null;
  views: number;
  likes: number;
  visits: number;
  clicks: number;
};

export type Category = {
  id: string;
  slug: string;
  label: string;
  image_url: string;
};
