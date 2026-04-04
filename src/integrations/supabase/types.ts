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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accommodations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          price_per_night: number
          tier: Database["public"]["Enums"]["accommodation_tier"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price_per_night?: number
          tier?: Database["public"]["Enums"]["accommodation_tier"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price_per_night?: number
          tier?: Database["public"]["Enums"]["accommodation_tier"]
        }
        Relationships: []
      }
      boats: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          accommodation_id: string | null
          check_in: string | null
          check_out: string | null
          course_id: string | null
          created_at: string
          diver_id: string
          id: string
          invoice_number: string | null
          notes: string | null
          payment_status: string
          total_amount: number
        }
        Insert: {
          accommodation_id?: string | null
          check_in?: string | null
          check_out?: string | null
          course_id?: string | null
          created_at?: string
          diver_id: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string
          total_amount?: number
        }
        Update: {
          accommodation_id?: string | null
          check_in?: string | null
          check_out?: string | null
          course_id?: string | null
          created_at?: string
          diver_id?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "accommodations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_diver_id_fkey"
            columns: ["diver_id"]
            isOneToOne: false
            referencedRelation: "divers"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          boat_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          instructor_id: string | null
          max_students: number
          name: string
          price: number
          start_date: string | null
        }
        Insert: {
          boat_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          instructor_id?: string | null
          max_students?: number
          name: string
          price?: number
          start_date?: string | null
        }
        Update: {
          boat_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          instructor_id?: string | null
          max_students?: number
          name?: string
          price?: number
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      dive_logs: {
        Row: {
          boat_id: string | null
          created_at: string
          date: string
          depth: number
          diver_id: string | null
          duration: number
          id: string
          instructor_id: string | null
          notes: string | null
          safety_checklist_completed: boolean
          site_id: string | null
          time_in: string | null
          time_out: string | null
        }
        Insert: {
          boat_id?: string | null
          created_at?: string
          date?: string
          depth?: number
          diver_id?: string | null
          duration?: number
          id?: string
          instructor_id?: string | null
          notes?: string | null
          safety_checklist_completed?: boolean
          site_id?: string | null
          time_in?: string | null
          time_out?: string | null
        }
        Update: {
          boat_id?: string | null
          created_at?: string
          date?: string
          depth?: number
          diver_id?: string | null
          duration?: number
          id?: string
          instructor_id?: string | null
          notes?: string | null
          safety_checklist_completed?: boolean
          site_id?: string | null
          time_in?: string | null
          time_out?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dive_logs_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dive_logs_diver_id_fkey"
            columns: ["diver_id"]
            isOneToOne: false
            referencedRelation: "divers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dive_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dive_logs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "dive_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      dive_sites: {
        Row: {
          created_at: string
          dan_info: string | null
          description: string | null
          difficulty: string
          emergency_contacts: string | null
          id: string
          location: string
          max_depth: number
          name: string
          nearest_hospital: string | null
        }
        Insert: {
          created_at?: string
          dan_info?: string | null
          description?: string | null
          difficulty?: string
          emergency_contacts?: string | null
          id?: string
          location: string
          max_depth?: number
          name: string
          nearest_hospital?: string | null
        }
        Update: {
          created_at?: string
          dan_info?: string | null
          description?: string | null
          difficulty?: string
          emergency_contacts?: string | null
          id?: string
          location?: string
          max_depth?: number
          name?: string
          nearest_hospital?: string | null
        }
        Relationships: []
      }
      divers: {
        Row: {
          certification: string | null
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          medical_conditions: string | null
          name: string
          skill_level: string
          total_dives: number
        }
        Insert: {
          certification?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          medical_conditions?: string | null
          name: string
          skill_level?: string
          total_dives?: number
        }
        Update: {
          certification?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          medical_conditions?: string | null
          name?: string
          skill_level?: string
          total_dives?: number
        }
        Relationships: []
      }
      emergency_procedures: {
        Row: {
          created_at: string
          description: string
          id: string
          procedure_type: string
          steps: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          procedure_type?: string
          steps?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          procedure_type?: string
          steps?: string | null
          title?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          buy_price: number
          can_buy: boolean
          can_rent: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          quantity: number
          rent_price_per_day: number
        }
        Insert: {
          buy_price?: number
          can_buy?: boolean
          can_rent?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          quantity?: number
          rent_price_per_day?: number
        }
        Update: {
          buy_price?: number
          can_buy?: boolean
          can_rent?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          quantity?: number
          rent_price_per_day?: number
        }
        Relationships: []
      }
      group_itinerary: {
        Row: {
          created_at: string
          day_number: number
          dive_site_id: string | null
          group_id: string
          id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          day_number: number
          dive_site_id?: string | null
          group_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          day_number?: number
          dive_site_id?: string | null
          group_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_itinerary_dive_site_id_fkey"
            columns: ["dive_site_id"]
            isOneToOne: false
            referencedRelation: "dive_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_itinerary_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          diver_id: string
          group_id: string
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          diver_id: string
          group_id: string
          id?: string
          role?: string | null
        }
        Update: {
          created_at?: string
          diver_id?: string
          group_id?: string
          id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_diver_id_fkey"
            columns: ["diver_id"]
            isOneToOne: false
            referencedRelation: "divers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          course_id: string | null
          created_at: string
          days: number | null
          description: string | null
          id: string
          leader_id: string | null
          name: string
          type: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          days?: number | null
          description?: string | null
          id?: string
          leader_id?: string | null
          name: string
          type?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          days?: number | null
          description?: string | null
          id?: string
          leader_id?: string | null
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "divers"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          certification: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          specialties: string | null
        }
        Insert: {
          certification?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          specialties?: string | null
        }
        Update: {
          certification?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          specialties?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          method: string
          notes: string | null
          paid_at: string
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          diver_id: string | null
          equipment_id: string | null
          id: string
          notes: string | null
          quantity: number
          total_price: number
          type: string
        }
        Insert: {
          created_at?: string
          diver_id?: string | null
          equipment_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          total_price?: number
          type?: string
        }
        Update: {
          created_at?: string
          diver_id?: string | null
          equipment_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          total_price?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_diver_id_fkey"
            columns: ["diver_id"]
            isOneToOne: false
            referencedRelation: "divers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      waivers: {
        Row: {
          created_at: string
          diver_id: string
          id: string
          notes: string | null
          signature_data: string | null
          signed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          diver_id: string
          id?: string
          notes?: string | null
          signature_data?: string | null
          signed_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          diver_id?: string
          id?: string
          notes?: string | null
          signature_data?: string | null
          signed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "waivers_diver_id_fkey"
            columns: ["diver_id"]
            isOneToOne: false
            referencedRelation: "divers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      accommodation_tier: "free_with_course" | "standard" | "deluxe"
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
      accommodation_tier: ["free_with_course", "standard", "deluxe"],
    },
  },
} as const
