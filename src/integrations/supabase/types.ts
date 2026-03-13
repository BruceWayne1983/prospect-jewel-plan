export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          retailer_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          retailer_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          retailer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      discovered_prospects: {
        Row: {
          address: string | null
          ai_reason: string | null
          category: Database["public"]["Enums"]["retailer_category"]
          county: string
          created_at: string
          discovered_date: string
          discovery_source: string | null
          estimated_price_positioning:
            | Database["public"]["Enums"]["store_positioning"]
            | null
          estimated_store_quality: number | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          predicted_fit_score: number | null
          rating: number | null
          raw_data: Json | null
          review_count: number | null
          status: Database["public"]["Enums"]["prospect_status"]
          town: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          ai_reason?: string | null
          category?: Database["public"]["Enums"]["retailer_category"]
          county: string
          created_at?: string
          discovered_date?: string
          discovery_source?: string | null
          estimated_price_positioning?:
            | Database["public"]["Enums"]["store_positioning"]
            | null
          estimated_store_quality?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          predicted_fit_score?: number | null
          rating?: number | null
          raw_data?: Json | null
          review_count?: number | null
          status?: Database["public"]["Enums"]["prospect_status"]
          town: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          ai_reason?: string | null
          category?: Database["public"]["Enums"]["retailer_category"]
          county?: string
          created_at?: string
          discovered_date?: string
          discovery_source?: string | null
          estimated_price_positioning?:
            | Database["public"]["Enums"]["store_positioning"]
            | null
          estimated_store_quality?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          predicted_fit_score?: number | null
          rating?: number | null
          raw_data?: Json | null
          review_count?: number | null
          status?: Database["public"]["Enums"]["prospect_status"]
          town?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          role_title: string | null
          territory: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          role_title?: string | null
          territory?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          role_title?: string | null
          territory?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      retailers: {
        Row: {
          activity: Json | null
          address: string | null
          ai_intelligence: Json | null
          ai_notes: string | null
          category: Database["public"]["Enums"]["retailer_category"]
          commercial_health_score: number | null
          competitor_brands: Json | null
          county: string
          created_at: string
          email: string | null
          fit_score: number | null
          id: string
          instagram: string | null
          is_independent: boolean | null
          lat: number | null
          lng: number | null
          name: string
          outreach: Json | null
          performance_prediction: Json | null
          phone: string | null
          pipeline_stage: Database["public"]["Enums"]["pipeline_stage"]
          postcode: string | null
          priority_score: number | null
          qualification: Json | null
          qualification_status: string | null
          rating: number | null
          review_count: number | null
          risk_flags: string[] | null
          spend_potential_score: number | null
          store_positioning:
            | Database["public"]["Enums"]["store_positioning"]
            | null
          town: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          activity?: Json | null
          address?: string | null
          ai_intelligence?: Json | null
          ai_notes?: string | null
          category?: Database["public"]["Enums"]["retailer_category"]
          commercial_health_score?: number | null
          competitor_brands?: Json | null
          county: string
          created_at?: string
          email?: string | null
          fit_score?: number | null
          id?: string
          instagram?: string | null
          is_independent?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          outreach?: Json | null
          performance_prediction?: Json | null
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          postcode?: string | null
          priority_score?: number | null
          qualification?: Json | null
          qualification_status?: string | null
          rating?: number | null
          review_count?: number | null
          risk_flags?: string[] | null
          spend_potential_score?: number | null
          store_positioning?:
            | Database["public"]["Enums"]["store_positioning"]
            | null
          town: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          activity?: Json | null
          address?: string | null
          ai_intelligence?: Json | null
          ai_notes?: string | null
          category?: Database["public"]["Enums"]["retailer_category"]
          commercial_health_score?: number | null
          competitor_brands?: Json | null
          county?: string
          created_at?: string
          email?: string | null
          fit_score?: number | null
          id?: string
          instagram?: string | null
          is_independent?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          outreach?: Json | null
          performance_prediction?: Json | null
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["pipeline_stage"]
          postcode?: string | null
          priority_score?: number | null
          qualification?: Json | null
          qualification_status?: string | null
          rating?: number | null
          review_count?: number | null
          risk_flags?: string[] | null
          spend_potential_score?: number | null
          store_positioning?:
            | Database["public"]["Enums"]["store_positioning"]
            | null
          town?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      pipeline_stage:
        | "new_lead"
        | "research_needed"
        | "qualified"
        | "priority_outreach"
        | "contacted"
        | "follow_up_needed"
        | "meeting_booked"
        | "under_review"
        | "approved"
        | "rejected"
      prospect_status: "new" | "reviewing" | "accepted" | "dismissed"
      retailer_category:
        | "jeweller"
        | "gift_shop"
        | "fashion_boutique"
        | "lifestyle_store"
        | "premium_accessories"
        | "concept_store"
      store_positioning: "premium" | "mid_market" | "budget"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      pipeline_stage: [
        "new_lead",
        "research_needed",
        "qualified",
        "priority_outreach",
        "contacted",
        "follow_up_needed",
        "meeting_booked",
        "under_review",
        "approved",
        "rejected",
      ],
      prospect_status: ["new", "reviewing", "accepted", "dismissed"],
      retailer_category: [
        "jeweller",
        "gift_shop",
        "fashion_boutique",
        "lifestyle_store",
        "premium_accessories",
        "concept_store",
      ],
      store_positioning: ["premium", "mid_market", "budget"],
    },
  },
} as const
