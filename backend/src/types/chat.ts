export type ChatMessage = {
  id: string;
  user_id: string | null;
  user_pseudo: string;
  user_avatar_url: string | null;
  user_role: "user" | "admin" | "system";
  message_type: "user" | "system";
  message: string;
  created_at: string;
  reply_to_message_id: string | null;
  reply_to_user_id: string | null;
  reply_to_user_pseudo: string | null;
  reply_to_message: string | null;
};
