export type UserRole = 'admin' | 'member'

export type EventColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: UserRole
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: UserRole
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: UserRole
          avatar_url?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          start_at: string
          end_at: string
          color: EventColor
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_at: string
          end_at: string
          color?: EventColor
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_at?: string
          end_at?: string
          color?: EventColor
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          pinned: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          pinned?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          pinned?: boolean
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']
