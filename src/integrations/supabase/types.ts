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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          cart_items: Json
          cart_total: number
          created_at: string
          customer_email: string
          customer_name: string | null
          id: string
          recovered: boolean
          recovery_email_sent: boolean
          recovery_email_sent_at: string | null
          store_owner_id: string
          store_slug: string
          updated_at: string
        }
        Insert: {
          cart_items?: Json
          cart_total?: number
          created_at?: string
          customer_email: string
          customer_name?: string | null
          id?: string
          recovered?: boolean
          recovery_email_sent?: boolean
          recovery_email_sent_at?: string | null
          store_owner_id: string
          store_slug: string
          updated_at?: string
        }
        Update: {
          cart_items?: Json
          cart_total?: number
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          id?: string
          recovered?: boolean
          recovery_email_sent?: boolean
          recovery_email_sent_at?: string | null
          store_owner_id?: string
          store_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_integrations: {
        Row: {
          created_at: string
          ga4_id: string
          id: string
          meta_pixel_id: string
          tiktok_pixel_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ga4_id?: string
          id?: string
          meta_pixel_id?: string
          tiktok_pixel_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ga4_id?: string
          id?: string
          meta_pixel_id?: string
          tiktok_pixel_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      category_images: {
        Row: {
          category_name: string
          created_at: string
          id: string
          image_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          image_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          image_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chatbot_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          store_owner_id: string
          store_slug: string
          updated_at: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          store_owner_id: string
          store_slug: string
          updated_at?: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          store_owner_id?: string
          store_slug?: string
          updated_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      chatbot_settings: {
        Row: {
          ai_model: string
          created_at: string
          enabled: boolean
          id: string
          knowledge_base: string
          primary_color: string
          updated_at: string
          user_id: string
          welcome_message: string
        }
        Insert: {
          ai_model?: string
          created_at?: string
          enabled?: boolean
          id?: string
          knowledge_base?: string
          primary_color?: string
          updated_at?: string
          user_id: string
          welcome_message?: string
        }
        Update: {
          ai_model?: string
          created_at?: string
          enabled?: boolean
          id?: string
          knowledge_base?: string
          primary_color?: string
          updated_at?: string
          user_id?: string
          welcome_message?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          sender_email: string
          sender_name: string
          store_owner_id: string
          store_slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          sender_email: string
          sender_name: string
          store_owner_id: string
          store_slug: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          sender_email?: string
          sender_name?: string
          store_owner_id?: string
          store_slug?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_settings: {
        Row: {
          auto_detect: boolean
          base_currency: string
          created_at: string
          enabled_currencies: string[]
          id: string
          rates: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_detect?: boolean
          base_currency?: string
          created_at?: string
          enabled_currencies?: string[]
          id?: string
          rates?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_detect?: boolean
          base_currency?: string
          created_at?: string
          enabled_currencies?: string[]
          id?: string
          rates?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      db_automations: {
        Row: {
          actions: Json
          created_at: string
          enabled: boolean
          id: string
          name: string
          table_id: string
          trigger: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          table_id: string
          trigger?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          table_id?: string
          trigger?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "db_automations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "db_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      db_fields: {
        Row: {
          created_at: string
          field_type: string
          id: string
          name: string
          options: Json
          position: number
          table_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field_type: string
          id?: string
          name: string
          options?: Json
          position?: number
          table_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          name?: string
          options?: Json
          position?: number
          table_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "db_fields_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "db_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      db_records: {
        Row: {
          created_at: string
          data: Json
          id: string
          position: number
          table_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          position?: number
          table_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          position?: number
          table_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "db_records_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "db_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      db_tables: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      delivery_tariffs: {
        Row: {
          created_at: string
          id: string
          price: number
          store_id: string
          updated_at: string
          wilaya: string
        }
        Insert: {
          created_at?: string
          id?: string
          price?: number
          store_id: string
          updated_at?: string
          wilaya: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          store_id?: string
          updated_at?: string
          wilaya?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          expires_at: string | null
          id: string
          updated_at: string
          usage_limit: number | null
          used_count: number
          user_id: string
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          user_id: string
          value?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          expires_at?: string | null
          id?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          audience_type: string
          created_at: string
          error: string | null
          failed_count: number
          id: string
          message: string
          recipients: string[]
          sent_at: string | null
          sent_count: number
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience_type?: string
          created_at?: string
          error?: string | null
          failed_count?: number
          id?: string
          message: string
          recipients?: string[]
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience_type?: string
          created_at?: string
          error?: string | null
          failed_count?: number
          id?: string
          message?: string
          recipients?: string[]
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      installed_apps: {
        Row: {
          app_key: string
          id: string
          installed_at: string
          user_id: string
        }
        Insert: {
          app_key: string
          id?: string
          installed_at?: string
          user_id: string
        }
        Update: {
          app_key?: string
          id?: string
          installed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          id: string
          notes: string | null
          shipping_address: string
          shipping_city: string
          shipping_country: string
          shipping_postal_code: string
          status: string
          store_owner_id: string
          store_slug: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          id?: string
          notes?: string | null
          shipping_address: string
          shipping_city: string
          shipping_country: string
          shipping_postal_code: string
          status?: string
          store_owner_id: string
          store_slug: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          id?: string
          notes?: string | null
          shipping_address?: string
          shipping_city?: string
          shipping_country?: string
          shipping_postal_code?: string
          status?: string
          store_owner_id?: string
          store_slug?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_submissions: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method: string
          plan: string
          proof_url: string
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_method: string
          plan: string
          proof_url: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          plan?: string
          proof_url?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      popups: {
        Row: {
          active: boolean
          background_color: string
          content: string
          created_at: string
          cta_label: string
          cta_url: string
          id: string
          text_color: string
          title: string
          trigger_type: string
          trigger_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          background_color?: string
          content?: string
          created_at?: string
          cta_label?: string
          cta_url?: string
          id?: string
          text_color?: string
          title?: string
          trigger_type?: string
          trigger_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          background_color?: string
          content?: string
          created_at?: string
          cta_label?: string
          cta_url?: string
          id?: string
          text_color?: string
          title?: string
          trigger_type?: string
          trigger_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          images: string[]
          name: string
          price: number
          stock: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          name: string
          price?: number
          stock?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          name?: string
          price?: number
          stock?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          email: string | null
          id: string
          name: string | null
          onboarded: boolean
          onboarding_completed: boolean
          plan: string
          plan_renews_at: string | null
          referral_code: string | null
          referred_by: string | null
          source_of_user: string | null
          subscription_end_date: string | null
          subscription_status: string
          subscription_type: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_wilaya: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          email?: string | null
          id: string
          name?: string | null
          onboarded?: boolean
          onboarding_completed?: boolean
          plan?: string
          plan_renews_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          source_of_user?: string | null
          subscription_end_date?: string | null
          subscription_status?: string
          subscription_type?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_wilaya?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          email?: string | null
          id?: string
          name?: string | null
          onboarded?: boolean
          onboarding_completed?: boolean
          plan?: string
          plan_renews_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          source_of_user?: string | null
          subscription_end_date?: string | null
          subscription_status?: string
          subscription_type?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_wilaya?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referee_id: string
          referrer_id: string
          reward_granted: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          referee_id: string
          referrer_id: string
          reward_granted?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          referee_id?: string
          referrer_id?: string
          reward_granted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings: {
        Row: {
          created_at: string
          id: string
          keywords: string
          meta_description: string
          meta_title: string
          og_image_url: string | null
          sitemap_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          keywords?: string
          meta_description?: string
          meta_title?: string
          og_image_url?: string | null
          sitemap_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          keywords?: string
          meta_description?: string
          meta_title?: string
          og_image_url?: string | null
          sitemap_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_languages: {
        Row: {
          created_at: string
          default_language: string
          enabled_languages: string[]
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_language?: string
          enabled_languages?: string[]
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_language?: string
          enabled_languages?: string[]
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          about_content: string
          about_image_url: string | null
          about_title: string
          accent_color: string
          background_color: string
          border_radius: string
          button_labels: Json
          button_style: string
          contact_address: string
          contact_email: string
          contact_form_enabled: boolean
          contact_intro: string
          contact_map_url: string
          contact_phone: string
          created_at: string
          currency: string
          font_family: string
          footer_about: string
          footer_copyright: string
          footer_socials: Json
          hero_cta_label: string
          hero_heading: string
          hero_image_url: string | null
          hero_layout: string
          hero_subheading: string
          logo_url: string | null
          nav_links: Json
          primary_color: string
          secondary_color: string
          section_order: string[]
          section_titles: Json
          show_categories: boolean
          show_featured: boolean
          show_hero: boolean
          show_newsletter: boolean
          show_search: boolean
          slug: string
          store_name: string
          tagline: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          about_content?: string
          about_image_url?: string | null
          about_title?: string
          accent_color?: string
          background_color?: string
          border_radius?: string
          button_labels?: Json
          button_style?: string
          contact_address?: string
          contact_email?: string
          contact_form_enabled?: boolean
          contact_intro?: string
          contact_map_url?: string
          contact_phone?: string
          created_at?: string
          currency?: string
          font_family?: string
          footer_about?: string
          footer_copyright?: string
          footer_socials?: Json
          hero_cta_label?: string
          hero_heading?: string
          hero_image_url?: string | null
          hero_layout?: string
          hero_subheading?: string
          logo_url?: string | null
          nav_links?: Json
          primary_color?: string
          secondary_color?: string
          section_order?: string[]
          section_titles?: Json
          show_categories?: boolean
          show_featured?: boolean
          show_hero?: boolean
          show_newsletter?: boolean
          show_search?: boolean
          slug: string
          store_name?: string
          tagline?: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          about_content?: string
          about_image_url?: string | null
          about_title?: string
          accent_color?: string
          background_color?: string
          border_radius?: string
          button_labels?: Json
          button_style?: string
          contact_address?: string
          contact_email?: string
          contact_form_enabled?: boolean
          contact_intro?: string
          contact_map_url?: string
          contact_phone?: string
          created_at?: string
          currency?: string
          font_family?: string
          footer_about?: string
          footer_copyright?: string
          footer_socials?: Json
          hero_cta_label?: string
          hero_heading?: string
          hero_image_url?: string | null
          hero_layout?: string
          hero_subheading?: string
          logo_url?: string | null
          nav_links?: Json
          primary_color?: string
          secondary_color?: string
          section_order?: string[]
          section_titles?: Json
          show_categories?: boolean
          show_featured?: boolean
          show_hero?: boolean
          show_newsletter?: boolean
          show_search?: boolean
          slug?: string
          store_name?: string
          tagline?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string
          id: string
          key: string
          language: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          language: string
          updated_at?: string
          user_id: string
          value?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          language?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      admin_set_plan: {
        Args: { _credits: number; _plan: string; _user_id: string }
        Returns: undefined
      }
      apply_referral_bonus: {
        Args: { _referee_id: string; _referrer_id: string }
        Returns: undefined
      }
      consume_credits: {
        Args: { _amount: number; _metadata?: Json; _reason: string }
        Returns: boolean
      }
      generate_referral_code: { Args: never; Returns: string }
      grant_credits: {
        Args: {
          _amount: number
          _metadata?: Json
          _reason: string
          _user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
