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
          path: string;
          bucket: string;
          team_id: string | null;
          player_id: string | null;
          player_name: string | null;
          caption: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          path: string;
          bucket?: string;
          team_id?: string | null;
          player_id?: string | null;
          player_name?: string | null;
          caption?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          path?: string;
          bucket?: string;
          team_id?: string | null;
          player_id?: string | null;
          player_name?: string | null;
          caption?: string | null;
        };
      };
    };
  };
};
