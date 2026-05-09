'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pin } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import CalendarView from '@/components/calendar/calendar-view'
import EventFormModal from '@/components/calendar/event-form-modal'
import type { Event, Announcement, Profile } from '@/types/database'

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [eventsRes, announcementsRes, profileRes] = await Promise.all([
      supabase.from('events').select('*').order('start_at'),
      supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])

    if (eventsRes.data) setEvents(eventsRes.data)
    if (announcementsRes.data) setAnnouncements(announcementsRes.data)
    if (profileRes.data) setProfile(profileRes.data)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">일정 캘린더</h1>
          {isAdmin && (
            <Button onClick={() => setAddOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              일정 추가
            </Button>
          )}
        </div>

        <CalendarView events={events} isAdmin={isAdmin} onEventUpdated={fetchData} />
      </div>

      <aside className="w-72 shrink-0 space-y-4">
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-sm text-gray-700 mb-3">최근 공지사항</h2>
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">공지사항이 없습니다</p>
          ) : (
            <ul className="space-y-3">
              {announcements.map(a => (
                <li key={a.id} className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {a.pinned && <Pin className="w-3 h-3 text-blue-500 shrink-0" />}
                    <p className="text-sm font-medium line-clamp-1">{a.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(a.created_at), 'M월 d일', { locale: ko })}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <a href="/announcements" className="block mt-3 text-xs text-blue-600 hover:underline text-right">
            전체 보기 →
          </a>
        </div>
      </aside>

      {addOpen && (
        <EventFormModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSaved={fetchData}
        />
      )}
    </div>
  )
}
