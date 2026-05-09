'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Event } from '@/types/database'
import EventFormModal from './event-form-modal'

const COLOR_LABEL: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
}

interface EventDetailModalProps {
  event: Event
  isAdmin: boolean
  open: boolean
  onClose: () => void
  onUpdated: () => void
}

export default function EventDetailModal({ event, isAdmin, open, onClose, onUpdated }: EventDetailModalProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('events').delete().eq('id', event.id)
    if (error) {
      toast.error('삭제 실패: ' + error.message)
    } else {
      toast.success('일정이 삭제되었습니다')
      onUpdated()
    }
    setDeleting(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${COLOR_LABEL[event.color] ?? 'bg-blue-500'}`} />
              <DialogTitle className="text-lg">{event.title}</DialogTitle>
            </div>
            <DialogDescription className="sr-only">일정 상세 정보</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">시작</p>
              <p className="text-sm">{format(new Date(event.start_at), 'yyyy년 M월 d일 (EEE) HH:mm', { locale: ko })}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">종료</p>
              <p className="text-sm">{format(new Date(event.end_at), 'yyyy년 M월 d일 (EEE) HH:mm', { locale: ko })}</p>
            </div>
            {event.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">설명</p>
                <p className="text-sm whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="flex-1">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                수정
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="flex-1">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {deleting ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editOpen && (
        <EventFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={onUpdated}
          defaultValues={event}
        />
      )}
    </>
  )
}
