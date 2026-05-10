export type UserRole = 'admin' | 'member'

export type EventColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange'

export interface RecurrenceRule {
  days: number[]       // 0=일, 1=월, ..., 6=토
  end_type: 'date' | 'count'
  end_date?: string    // 'YYYY-MM-DD', end_type='date' 일 때
  end_count?: number   // end_type='count' 일 때
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: UserRole
          position: string | null
          phone: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: UserRole
          position?: string | null
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: UserRole
          position?: string | null
          phone?: string | null
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
          recurrence_group_id: string | null
          recurrence_rule: RecurrenceRule | null
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
          recurrence_group_id?: string | null
          recurrence_rule?: RecurrenceRule | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_at?: string
          end_at?: string
          color?: EventColor
          recurrence_group_id?: string | null
          recurrence_rule?: RecurrenceRule | null
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
      event_participants: {
        Row: {
          id: string
          event_id: string
          profile_id: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          profile_id: string
          created_at?: string
        }
        Update: never
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
export type EventParticipant = Database['public']['Tables']['event_participants']['Row']
