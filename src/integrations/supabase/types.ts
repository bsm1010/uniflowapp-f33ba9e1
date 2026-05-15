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
      ai_agent_analytics: {
        Row: {
          ai_replies: number
          ai_success_rate: number
          avg_response_time_ms: number
          created_at: string
          date: string
          human_replies: number
          id: string
          sales_generated: number
          top_questions: Json | null
          total_conversations: number
          user_id: string
          voice_messages_processed: number
        }
        Insert: {
          ai_replies?: number
          ai_success_rate?: number
          avg_response_time_ms?: number
          created_at?: string
          date?: string
          human_replies?: number
          id?: string
          sales_generated?: number
          top_questions?: Json | null
          total_conversations?: number
          user_id: string
          voice_messages_processed?: number
        }
        Update: {
          ai_replies?: number
          ai_success_rate?: number
          avg_response_time_ms?: number
          created_at?: string
          date?: string
          human_replies?: number
          id?: string
          sales_generated?: number
          top_questions?: Json | null
          total_conversations?: number
          user_id?: string
          voice_messages_processed?: number
        }
        Relationships: []
      }
      ai_agent_settings: {
        Row: {
          auto_reply: boolean
          created_at: string
          custom_instructions: string
          darija_level: string
          enabled: boolean
          faq_entries: Json
          forbidden_words: string[] | null
          greeting_message: string
          id: string
          language_mode: string
          max_ai_turns: number
          personality: string
          reply_delay_seconds: number
          suggest_human_takeover: boolean
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_reply?: boolean
          created_at?: string
          custom_instructions?: string
          darija_level?: string
          enabled?: boolean
          faq_entries?: Json
          forbidden_words?: string[] | null
          greeting_message?: string
          id?: string
          language_mode?: string
          max_ai_turns?: number
          personality?: string
          reply_delay_seconds?: number
          suggest_human_takeover?: boolean
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_reply?: boolean
          created_at?: string
          custom_instructions?: string
          darija_level?: string
          enabled?: boolean
          faq_entries?: Json
          forbidden_words?: string[] | null
          greeting_message?: string
          id?: string
          language_mode?: string
          max_ai_turns?: number
          personality?: string
          reply_delay_seconds?: number
          suggest_human_takeover?: boolean
          tone?: string
          updated_at?: string
          user_id?: string
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
      custom_domains: {
        Row: {
          created_at: string
          detected_provider: string | null
          dns_records: Json
          domain: string
          domain_type: string
          error_message: string | null
          id: string
          is_primary: boolean
          last_checked_at: string | null
          ssl_active: boolean
          status: string
          store_slug: string
          updated_at: string
          user_id: string
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          detected_provider?: string | null
          dns_records?: Json
          domain: string
          domain_type?: string
          error_message?: string | null
          id?: string
          is_primary?: boolean
          last_checked_at?: string | null
          ssl_active?: boolean
          status?: string
          store_slug: string
          updated_at?: string
          user_id: string
          verification_token: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          detected_provider?: string | null
          dns_records?: Json
          domain?: string
          domain_type?: string
          error_message?: string | null
          id?: string
          is_primary?: boolean
          last_checked_at?: string | null
          ssl_active?: boolean
          status?: string
          store_slug?: string
          updated_at?: string
          user_id?: string
          verification_token?: string
          verified_at?: string | null
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
      delivery_companies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_tariffs: {
        Row: {
          city: string
          company_id: string | null
          created_at: string
          delivery_type: string
          id: string
          price: number
          store_id: string
          updated_at: string
          wilaya: string
        }
        Insert: {
          city?: string
          company_id?: string | null
          created_at?: string
          delivery_type?: string
          id?: string
          price?: number
          store_id: string
          updated_at?: string
          wilaya: string
        }
        Update: {
          city?: string
          company_id?: string | null
          created_at?: string
          delivery_type?: string
          id?: string
          price?: number
          store_id?: string
          updated_at?: string
          wilaya?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tariffs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
        ]
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      ig_conversations: {
        Row: {
          ai_confidence: number | null
          created_at: string
          customer_instagram_id: string
          customer_name: string
          customer_profile_pic: string | null
          customer_username: string
          id: string
          instagram_conversation_id: string | null
          last_message_at: string | null
          last_message_text: string | null
          mode: string
          sentiment: string | null
          status: string
          tags: string[] | null
          unread_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          created_at?: string
          customer_instagram_id: string
          customer_name?: string
          customer_profile_pic?: string | null
          customer_username?: string
          id?: string
          instagram_conversation_id?: string | null
          last_message_at?: string | null
          last_message_text?: string | null
          mode?: string
          sentiment?: string | null
          status?: string
          tags?: string[] | null
          unread_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          created_at?: string
          customer_instagram_id?: string
          customer_name?: string
          customer_profile_pic?: string | null
          customer_username?: string
          id?: string
          instagram_conversation_id?: string | null
          last_message_at?: string | null
          last_message_text?: string | null
          mode?: string
          sentiment?: string | null
          status?: string
          tags?: string[] | null
          unread_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ig_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          instagram_message_id: string | null
          is_ai_generated: boolean
          message_type: string
          metadata: Json | null
          read: boolean
          sender_type: string
          user_id: string
          voice_audio_url: string | null
          voice_transcript: string | null
        }
        Insert: {
          attachments?: Json | null
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          instagram_message_id?: string | null
          is_ai_generated?: boolean
          message_type?: string
          metadata?: Json | null
          read?: boolean
          sender_type?: string
          user_id: string
          voice_audio_url?: string | null
          voice_transcript?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          instagram_message_id?: string | null
          is_ai_generated?: boolean
          message_type?: string
          metadata?: Json | null
          read?: boolean
          sender_type?: string
          user_id?: string
          voice_audio_url?: string | null
          voice_transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ig_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ig_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_connections: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          instagram_user_id: string | null
          instagram_username: string | null
          last_synced_at: string | null
          page_id: string | null
          page_name: string | null
          profile_picture_url: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          instagram_user_id?: string | null
          instagram_username?: string | null
          last_synced_at?: string | null
          page_id?: string | null
          page_name?: string | null
          profile_picture_url?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          instagram_user_id?: string | null
          instagram_username?: string | null
          last_synced_at?: string | null
          page_id?: string | null
          page_name?: string | null
          profile_picture_url?: string | null
          status?: string
          token_expires_at?: string | null
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
      section_templates: {
        Row: {
          block_key: string
          category: string
          created_at: string
          id: string
          name: string
          props: Json
          style_overrides: Json
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          block_key: string
          category?: string
          created_at?: string
          id?: string
          name: string
          props?: Json
          style_overrides?: Json
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          block_key?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
          props?: Json
          style_overrides?: Json
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      shipments: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          order_id: string
          status: string
          store_id: string
          tracking_number: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          order_id: string
          status?: string
          store_id: string
          tracking_number?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          order_id?: string
          status?: string
          store_id?: string
          tracking_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      store_delivery_companies: {
        Row: {
          api_key: string
          api_secret: string
          company_id: string
          created_at: string
          enabled: boolean
          id: string
          is_default: boolean
          store_id: string
          updated_at: string
        }
        Insert: {
          api_key?: string
          api_secret?: string
          company_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          is_default?: boolean
          store_id: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          api_secret?: string
          company_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          is_default?: boolean
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_delivery_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "delivery_companies"
            referencedColumns: ["id"]
          },
        ]
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
          sections: Json
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
          sections?: Json
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
          sections?: Json
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
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
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      validate_discount_code: {
        Args: { _code: string; _user_id: string }
        Returns: {
          active: boolean
          code: string
          discount_type: string
          expires_at: string
          id: string
          usage_limit: number
          used_count: number
          value: number
        }[]
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
