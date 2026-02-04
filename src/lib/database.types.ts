// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string;
          value_int: number;
          updated_at: string;
        };
        Insert: {
          key: string;
          value_int: number;
          updated_at: string;
        };
        Update: {
          key: string;
          value_int: number;
          updated_at: string;
        };
      };
      users: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id: string;
          name: string;
        };
        Update: {
          id: string;
          name: string;
        };
      };
      players: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          team_id: string;
          name: string;
          created_at: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      uploads: {
        Row: {
          id: string;
          created_at: string;
          image_path: string;
          display_path: string | null;
          thumb_path: string | null;
          content_hash: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          id: string;
          created_at: string;
          image_path: string;
          display_path: string | null;
          thumb_path: string | null;
          content_hash: string | null;
          status: string;
          user_id: string;
        };
        Update: {
          id: string;
          created_at: string;
          image_path: string;
          display_path: string | null;
          thumb_path: string | null;
          content_hash: string | null;
          status: string;
          user_id: string;
        };
      };
    };
  };
};
