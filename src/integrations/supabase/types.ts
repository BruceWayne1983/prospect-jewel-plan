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
      brand_assets: {
        Row: {
          ai_extracted_data: Json | null
          ai_summary: string | null
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_extracted_data?: Json | null
          ai_summary?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number
          file_type?: string | null
          id?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_extracted_data?: Json | null
          ai_summary?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          id: string
          notes: string | null
          retailer_id: string | null
          retailer_name: string | null
          time: string | null
          title: string
          town: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          retailer_id?: string | null
          retailer_name?: string | null
          time?: string | null
          title: string
          town?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          retailer_id?: string | null
          retailer_name?: string | null
          time?: string | null
          title?: string
          town?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_retailer_id_fkey"
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
          email: string | null
          estimated_monthly_traffic: number | null
          estimated_price_positioning:
            | Database["public"]["Enums"]["store_positioning"]
            | null
          estimated_store_quality: number | null
          facebook: string | null
          follower_counts: Json | null
          google_review_highlights: Json | null
          google_review_summary: string | null
          id: string
          instagram: string | null
          lat: number | null
          linkedin: string | null
          lng: number | null
          location_context: string | null
          name: string
          phone: string | null
          predicted_fit_score: number | null
          rating: number | null
          raw_data: Json | null
          review_count: number | null
          social_verified: boolean | null
          status: Database["public"]["Enums"]["prospect_status"]
          store_images: string[] | null
          tiktok: string | null
          town: string
          twitter: string | null
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
          email?: string | null
          estimated_monthly_traffic?: number | null
          estimated_price_positioning?:
            | Database["public"]["Enums"]["store_positioning"]
            | null
          estimated_store_quality?: number | null
          facebook?: string | null
          follower_counts?: Json | null
          google_review_highlights?: Json | null
          google_review_summary?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          linkedin?: string | null
          lng?: number | null
          location_context?: string | null
          name: string
          phone?: string | null
          predicted_fit_score?: number | null
          rating?: number | null
          raw_data?: Json | null
          review_count?: number | null
          social_verified?: boolean | null
          status?: Database["public"]["Enums"]["prospect_status"]
          store_images?: string[] | null
          tiktok?: string | null
          town: string
          twitter?: string | null
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
          email?: string | null
          estimated_monthly_traffic?: number | null
          estimated_price_positioning?:
            | Database["public"]["Enums"]["store_positioning"]
            | null
          estimated_store_quality?: number | null
          facebook?: string | null
          follower_counts?: Json | null
          google_review_highlights?: Json | null
          google_review_summary?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          linkedin?: string | null
          lng?: number | null
          location_context?: string | null
          name?: string
          phone?: string | null
          predicted_fit_score?: number | null
          rating?: number | null
          raw_data?: Json | null
          review_count?: number | null
          social_verified?: boolean | null
          status?: Database["public"]["Enums"]["prospect_status"]
          store_images?: string[] | null
          tiktok?: string | null
          town?: string
          twitter?: string | null
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
      retail_locations: {
        Row: {
          address: string | null
          ai_summary: string | null
          county: string
          created_at: string
          discovery_source: string | null
          footfall_estimate: string | null
          has_fashion_boutiques: boolean | null
          has_gift_stores: boolean | null
          has_jewellery_stores: boolean | null
          id: string
          key_tenants: string[] | null
          lat: number | null
          lng: number | null
          location_type: string
          name: string
          opportunity_notes: string | null
          postcode: string | null
          scraped_data: Json | null
          tenant_count: number | null
          town: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          ai_summary?: string | null
          county: string
          created_at?: string
          discovery_source?: string | null
          footfall_estimate?: string | null
          has_fashion_boutiques?: boolean | null
          has_gift_stores?: boolean | null
          has_jewellery_stores?: boolean | null
          id?: string
          key_tenants?: string[] | null
          lat?: number | null
          lng?: number | null
          location_type?: string
          name: string
          opportunity_notes?: string | null
          postcode?: string | null
          scraped_data?: Json | null
          tenant_count?: number | null
          town: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          ai_summary?: string | null
          county?: string
          created_at?: string
          discovery_source?: string | null
          footfall_estimate?: string | null
          has_fashion_boutiques?: boolean | null
          has_gift_stores?: boolean | null
          has_jewellery_stores?: boolean | null
          id?: string
          key_tenants?: string[] | null
          lat?: number | null
          lng?: number | null
          location_type?: string
          name?: string
          opportunity_notes?: string | null
          postcode?: string | null
          scraped_data?: Json | null
          tenant_count?: number | null
          town?: string
          updated_at?: string
          user_id?: string
          website?: string | null
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
          estimated_monthly_traffic: number | null
          facebook: string | null
          fit_score: number | null
          follower_counts: Json | null
          google_review_highlights: Json | null
          google_review_summary: string | null
          id: string
          instagram: string | null
          is_independent: boolean | null
          lat: number | null
          linkedin: string | null
          lng: number | null
          location_context: string | null
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
          retail_location_id: string | null
          review_count: number | null
          risk_flags: string[] | null
          social_verified: boolean | null
          spend_potential_score: number | null
          store_images: string[] | null
          store_positioning:
            | Database["public"]["Enums"]["store_positioning"]
            | null
          tiktok: string | null
          town: string
          twitter: string | null
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
          estimated_monthly_traffic?: number | null
          facebook?: string | null
          fit_score?: number | null
          follower_counts?: Json | null
          google_review_highlights?: Json | null
          google_review_summary?: string | null
          id?: string
          instagram?: string | null
          is_independent?: boolean | null
          lat?: number | null
          linkedin?: string | null
          lng?: number | null
          location_context?: string | null
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
          retail_location_id?: string | null
          review_count?: number | null
          risk_flags?: string[] | null
          social_verified?: boolean | null
          spend_potential_score?: number | null
          store_images?: string[] | null
          store_positioning?:
            | Database["public"]["Enums"]["store_positioning"]
            | null
          tiktok?: string | null
          town: string
          twitter?: string | null
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
          estimated_monthly_traffic?: number | null
          facebook?: string | null
          fit_score?: number | null
          follower_counts?: Json | null
          google_review_highlights?: Json | null
          google_review_summary?: string | null
          id?: string
          instagram?: string | null
          is_independent?: boolean | null
          lat?: number | null
          linkedin?: string | null
          lng?: number | null
          location_context?: string | null
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
          retail_location_id?: string | null
          review_count?: number | null
          risk_flags?: string[] | null
          social_verified?: boolean | null
          spend_potential_score?: number | null
          store_images?: string[] | null
          store_positioning?:
            | Database["public"]["Enums"]["store_positioning"]
            | null
          tiktok?: string | null
          town?: string
          twitter?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retailers_retail_location_id_fkey"
            columns: ["retail_location_id"]
            isOneToOne: false
            referencedRelation: "retail_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_files: {
        Row: {
          ai_summary: string | null
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          parsed_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number
          file_type?: string | null
          id?: string
          parsed_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          parsed_data?: Json | null
          updated_at?: string
          user_id?: string
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
