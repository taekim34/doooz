export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      badges: {
        Row: { description: string | null; icon: string | null; id: string; name: string; rule_type: string; rule_value: number; sort_order: number | null }
        Insert: { description?: string | null; icon?: string | null; id: string; name: string; rule_type: string; rule_value?: number; sort_order?: number | null }
        Update: { description?: string | null; icon?: string | null; id?: string; name?: string; rule_type?: string; rule_value?: number; sort_order?: number | null }
        Relationships: []
      }
      characters: {
        Row: { asset_base_path: string; id: string; name: string; unlock_level: number }
        Insert: { asset_base_path: string; id: string; name: string; unlock_level?: number }
        Update: { asset_base_path?: string; id?: string; name?: string; unlock_level?: number }
        Relationships: []
      }
      chore_instances: {
        Row: { assignee_id: string; completed_at: string | null; created_at: string; due_date: string; family_id: string; id: string; points: number; status: string; template_id: string | null; title: string }
        Insert: { assignee_id: string; completed_at?: string | null; created_at?: string; due_date: string; family_id: string; id?: string; points: number; status?: string; template_id?: string | null; title: string }
        Update: { assignee_id?: string; completed_at?: string | null; created_at?: string; due_date?: string; family_id?: string; id?: string; points?: number; status?: string; template_id?: string | null; title?: string }
        Relationships: []
      }
      chore_templates: {
        Row: { active: boolean; assignee_id: string; created_at: string; created_by: string; description: string | null; end_date: string | null; family_id: string; id: string; points: number; recurrence: Json; start_date: string; title: string }
        Insert: { active?: boolean; assignee_id: string; created_at?: string; created_by: string; description?: string | null; end_date?: string | null; family_id: string; id?: string; points: number; recurrence: Json; start_date: string; title: string }
        Update: { active?: boolean; assignee_id?: string; created_at?: string; created_by?: string; description?: string | null; end_date?: string | null; family_id?: string; id?: string; points?: number; recurrence?: Json; start_date?: string; title?: string }
        Relationships: []
      }
      families: {
        Row: { created_at: string; id: string; invite_code: string; locale: string; name: string; timezone: string }
        Insert: { created_at?: string; id?: string; invite_code: string; locale?: string; name: string; timezone?: string }
        Update: { created_at?: string; id?: string; invite_code?: string; locale?: string; name?: string; timezone?: string }
        Relationships: []
      }
      family_rollover_log: {
        Row: { family_id: string; local_date: string; ran_at: string }
        Insert: { family_id: string; local_date: string; ran_at?: string }
        Update: { family_id?: string; local_date?: string; ran_at?: string }
        Relationships: []
      }
      point_transactions: {
        Row: { actor_id: string; amount: number; created_at: string; family_id: string; id: string; kind: string; reason: string; related_chore_id: string | null; user_id: string }
        Insert: { actor_id: string; amount: number; created_at?: string; family_id: string; id?: string; kind: string; reason: string; related_chore_id?: string | null; user_id: string }
        Update: { actor_id?: string; amount?: number; created_at?: string; family_id?: string; id?: string; kind?: string; reason?: string; related_chore_id?: string | null; user_id?: string }
        Relationships: []
      }
      push_subscriptions: {
        Row: { created_at: string | null; endpoint: string; id: string; keys_auth: string; keys_p256dh: string; user_id: string }
        Insert: { created_at?: string | null; endpoint: string; id?: string; keys_auth: string; keys_p256dh: string; user_id: string }
        Update: { created_at?: string | null; endpoint?: string; id?: string; keys_auth?: string; keys_p256dh?: string; user_id?: string }
        Relationships: []
      }
      reward_requests: {
        Row: { cost_snapshot: number; decided_at: string | null; decided_by: string | null; decision_note: string | null; family_id: string; id: string; related_transaction_id: string | null; requested_at: string; requested_by: string; reward_id: string; reward_title_snapshot: string; status: string; user_id: string }
        Insert: { cost_snapshot: number; decided_at?: string | null; decided_by?: string | null; decision_note?: string | null; family_id: string; id?: string; related_transaction_id?: string | null; requested_at?: string; requested_by: string; reward_id: string; reward_title_snapshot: string; status: string; user_id?: string }
        Update: { cost_snapshot?: number; decided_at?: string | null; decided_by?: string | null; decision_note?: string | null; family_id?: string; id?: string; related_transaction_id?: string | null; requested_at?: string; requested_by?: string; reward_id?: string; reward_title_snapshot?: string; status?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "reward_requests_reward_id_fkey"; columns: ["reward_id"]; isOneToOne: false; referencedRelation: "rewards"; referencedColumns: ["id"] },
          { foreignKeyName: "reward_requests_requested_by_fkey"; columns: ["requested_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      rewards: {
        Row: { active: boolean; cost: number; created_at: string; created_by: string; family_id: string; icon: string | null; id: string; title: string }
        Insert: { active?: boolean; cost: number; created_at?: string; created_by: string; family_id: string; icon?: string | null; id?: string; title: string }
        Update: { active?: boolean; cost?: number; created_at?: string; created_by?: string; family_id?: string; icon?: string | null; id?: string; title?: string }
        Relationships: []
      }
      user_badges: {
        Row: { badge_id: string; earned_at: string; user_id: string }
        Insert: { badge_id: string; earned_at?: string; user_id: string }
        Update: { badge_id?: string; earned_at?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "user_badges_badge_id_fkey"; columns: ["badge_id"]; isOneToOne: false; referencedRelation: "badges"; referencedColumns: ["id"] },
          { foreignKeyName: "user_badges_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      users: {
        Row: { birth_date: string | null; character_id: string | null; created_at: string; current_balance: number; display_name: string; family_id: string; id: string; level: number; lifetime_earned: number; role: string }
        Insert: { birth_date?: string | null; character_id?: string | null; created_at?: string; current_balance?: number; display_name: string; family_id: string; id: string; level?: number; lifetime_earned?: number; role: string }
        Update: { birth_date?: string | null; character_id?: string | null; created_at?: string; current_balance?: number; display_name?: string; family_id?: string; id?: string; level?: number; lifetime_earned?: number; role?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      approve_reward_request: { Args: { p_request_id: string }; Returns: string }
      auth_family_id: { Args: never; Returns: string }
      calculate_level: { Args: { lifetime: number }; Returns: number }
      cancel_reward_request: { Args: { p_request_id: string }; Returns: undefined }
      complete_chore: { Args: { p_actor_id: string; p_instance_id: string }; Returns: Json }
      dooooz_midnight_rollover: { Args: never; Returns: number }
      ensure_today_instances: { Args: { p_family_id: string; p_user_id: string }; Returns: number }
      evaluate_badges: { Args: { p_user_id: string }; Returns: string[] }
      pardon_chore: { Args: { p_instance_id: string }; Returns: undefined }
      redeem_points: { Args: { p_actor_id: string; p_amount: number; p_reason: string; p_reward_id?: string; p_user_id: string }; Returns: Json }
      reject_reward_request: { Args: { p_note: string; p_request_id: string }; Returns: undefined }
      request_reward: { Args: { p_reward_id: string }; Returns: string }
      uncomplete_chore: { Args: { p_actor_id: string; p_instance_id: string }; Returns: Json }
      unpardon_chore: { Args: { p_instance_id: string }; Returns: undefined }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  N extends T extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[T["schema"]]["Tables"] & DatabaseWithoutInternals[T["schema"]]["Views"])
    : never = never,
> = T extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[T["schema"]]["Tables"] & DatabaseWithoutInternals[T["schema"]]["Views"])[N] extends { Row: infer R } ? R : never
  : T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never
    : never

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  N extends T extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[T["schema"]]["Tables"]
    : never = never,
> = T extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[T["schema"]]["Tables"][N] extends { Insert: infer I } ? I : never
  : T extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never
    : never

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  N extends T extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[T["schema"]]["Tables"]
    : never = never,
> = T extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[T["schema"]]["Tables"][N] extends { Update: infer U } ? U : never
  : T extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never
    : never
