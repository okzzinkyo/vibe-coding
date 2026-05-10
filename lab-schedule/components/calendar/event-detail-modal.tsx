'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Pencil, Trash2, Users, Repeat } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Event, Profile } from '@/types/database'
import EventFormModal from './event-form-modal'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [editScopeOpen, setEditScopeOpen] = useState(false)
  const [deleteScopeOpen, setDeleteScopeOpen] = useState(false)
  const [editScope, setEditScope] = useState<'single' | 'future'>('single')
  const [deleting, setDeleting] = useState(false)
  const [participants, setParticipants] = useState<Profile[]>([])

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase
      .from('event_participants')
      .select('profiles(*)')
      .eq('event_id', event.id)
      .then(({ data }) => {
        if (data) setParticipants(data.map((d: { profiles: Profile }) => d.profiles))
      })
  }, [open, event.id])

  const handleEditClick = () => {
    if (event.recurrence_group_id) {
      setEditScopeOpen(true)
    } else {
      setEditOpen(true)
    }
  }

  const handleDeleteClick = () => {
    if (event.recurrence_group_id) {
      setDeleteScopeOpen(true)
    } else {
      setDeleteConfirmOpen(true)
    }
  }

  const handleDelete = async (scope: 'single' | 'future') => {
    setDeleting(true)
    const supabase = createClient()
    let error

    if (scope === 'future' && event.recurrence_group_id) {
      ;({ error } = await supabase.from('events').delete()
        .eq('recurrence_group_id', event.recurrence_group_id)
        .gte('start_at', event.start_at))
    } else {
      ;({ error } = await supabase.from('events').delete().eq('id', event.id))
    }

    if (error) {
      toast.error('삭제 실패: ' + error.message)
    } else {
      toast.success('일정이 삭제되었습니다')
      setDeleteConfirmOpen(false)
      setDeleteScopeOpen(false)
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
            {event.recurrence_group_id && event.recurrence_rule && (
              <div className="flex items-center gap-1.5 text-blue-600">
                <Repeat className="w-3.5 h-3.5 shrink-0" />
                <p className="text-xs">
                  매주 {event.recurrence_rule.days.map(d => DAY_LABELS[d]).join('·')} 반복
                </p>
              </div>
            )}

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

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">참여자 ({participants.length}명)</p>
              </div>
              {participants.length === 0 ? (
                <p className="text-xs text-muted-foreground">참여자가 없습니다</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-2.5 py-1">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                          {p.name.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{p.name}</span>
                      {p.position && <span className="text-xs text-muted-foreground">{p.position}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleEditClick} className="flex-1">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                수정
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteClick} className="flex-1">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                삭제
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 반복 일정 수정 범위 선택 */}
      <Dialog open={editScopeOpen} onOpenChange={setEditScopeOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>반복 일정 수정</DialogTitle>
            <DialogDescription>어떤 일정을 수정할까요?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-1">
            <Button
              variant="outline"
              onClick={() => { setEditScope('single'); setEditScopeOpen(false); setEditOpen(true) }}
            >
              이 일정만
            </Button>
            <Button
              variant="outline"
              onClick={() => { setEditScope('future'); setEditScopeOpen(false); setEditOpen(true) }}
            >
              이 일정 + 이후 전체
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 반복 일정 삭제 범위 선택 */}
      <Dialog open={deleteScopeOpen} onOpenChange={setDeleteScopeOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>반복 일정 삭제</DialogTitle>
            <DialogDescription>어떤 일정을 삭제할까요?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-1">
            <Button variant="outline" onClick={() => handleDelete('single')} disabled={deleting}>
              이 일정만
            </Button>
            <Button variant="destructive" onClick={() => handleDelete('future')} disabled={deleting}>
              {deleting ? '삭제 중...' : '이 일정 + 이후 전체'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 단일 일정 삭제 확인 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>일정 삭제</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{event.title}</span> 일정을 삭제하시겠습니까?
              <br />
              삭제된 일정은 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={() => handleDelete('single')} disabled={deleting}>
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editOpen && (
        <EventFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={onUpdated}
          defaultValues={event}
          editScope={event.recurrence_group_id ? editScope : undefined}
        />
      )}
    </>
  )
}
