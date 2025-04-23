export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string
          xp: number
          level: number
          scrap: number
        }
        Insert: {
          id?: string
          wallet_address: string
          xp?: number
          level?: number
          scrap?: number
        }
        Update: {
          id?: string
          wallet_address?: string
          xp?: number
          level?: number
          scrap?: number
        }
      }
      items: {
        Row: {
          id: string
          name: string
          type: string
          image_url: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          image_url: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          image_url?: string
        }
      }
      staking: {
        Row: {
          id: string
          user_id: string
          amount: number
          start_date: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          start_date?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          start_date?: string
        }
      }
      quests: {
        Row: {
          id: string
          name: string
          description: string
          reward: Json
        }
        Insert: {
          id?: string
          name: string
          description: string
          reward: Json
        }
        Update: {
          id?: string
          name?: string
          description?: string
          reward?: Json
        }
      }
      user_quest: {
        Row: {
          user_id: string
          quest_id: string
          completed_at: string
        }
        Insert: {
          user_id: string
          quest_id: string
          completed_at?: string
        }
        Update: {
          user_id?: string
          quest_id?: string
          completed_at?: string
        }
      }
      fusion_logs: {
        Row: {
          id: string
          user_id: string
          token_id: string
          sticker_id: string
          date: string
        }
        Insert: {
          id?: string
          user_id: string
          token_id: string
          sticker_id: string
          date?: string
        }
        Update: {
          id?: string
          user_id?: string
          token_id?: string
          sticker_id?: string
          date?: string
        }
      }
      tokens: {
        Row: {
          id: string
          name: string
          image_url: string
          attributes: Json
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          image_url: string
          attributes: Json
          owner_id: string
        }
        Update: {
          id?: string
          name?: string
          image_url?: string
          attributes?: Json
          owner_id?: string
        }
      }
      user_items: {
        Row: {
          user_id: string
          item_id: string
          quantity: number
        }
        Insert: {
          user_id: string
          item_id: string
          quantity: number
        }
        Update: {
          user_id?: string
          item_id?: string
          quantity?: number
        }
      }
      boosters: {
        Row: {
          id: string
          user_id: string
          type: string
          opened: boolean
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          opened?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          opened?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
