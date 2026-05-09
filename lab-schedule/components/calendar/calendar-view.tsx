'use client'

import { useState, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { Event } from '@/types/database'
import EventDetailModal from './event-detail-modal'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { ko },
})

const COLOR_MAP: Record<string, string> = {
  blue:   '#3b82f6',
  green:  '#22c55e',
  red:    '#ef4444',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Event
}

interface CalendarViewProps {
  events: Event[]
  isAdmin: boolean
  onEventUpdated: () => void
}

export default function CalendarView({ events, isAdmin, onEventUpdated }: CalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const calendarEvents: CalendarEvent[] = events.map(e => ({
    id: e.id,
    title: e.title,
    start: new Date(e.start_at),
    end: new Date(e.end_at),
    resource: e,
  }))

  const eventStyleGetter = useCallback((event: CalendarEvent) => ({
    style: {
      backgroundColor: COLOR_MAP[event.resource.color] ?? COLOR_MAP.blue,
      borderRadius: '6px',
      border: 'none',
      color: 'white',
      fontSize: '12px',
      padding: '2px 6px',
    },
  }), [])

  const messages = {
    today: '오늘',
    previous: '이전',
    next: '다음',
    month: '월',
    week: '주',
    day: '일',
    agenda: '목록',
    date: '날짜',
    time: '시간',
    event: '일정',
    noEventsInRange: '이 기간에 일정이 없습니다.',
  }

  return (
    <>
      <div style={{ height: 'calc(100vh - 140px)' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          defaultView={Views.MONTH}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          messages={messages}
          culture="ko"
          eventPropGetter={eventStyleGetter}
          onSelectEvent={e => setSelectedEvent(e.resource)}
          style={{ fontFamily: 'inherit' }}
        />
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isAdmin={isAdmin}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdated={() => {
            setSelectedEvent(null)
            onEventUpdated()
          }}
        />
      )}
    </>
  )
}
