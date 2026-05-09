'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Event, EventColor, Profile } from '@/types/database'

const schema = z.object({
  title: z.string().min(1, '제목을 입력하세요'),
  description: z.string().optional(),
  start_at: z.string().min(1, '시작 시간을 입력하세요'),
  end_at: z.string().min(1, '종료 시간을 입력하세요'),
  color: z.enum(['blue', 'green', 'red', 'yellow', 'purple', 'orange']),
})

type FormData = z.infer<typeof schema>

const COLORS: { value: EventColor; label: string; className: string }[] = [
  { value: 'blue',   label: '파란색',  className: 'bg-blue-500' },
  { value: 'green',  label: '초록색',  className: 'bg-green-500' },
  { value: 'red',    label: '빨간색',  className: 'bg-red-500' },
  { value: 'yellow', label: '노란색',  className: 'bg-yellow-500' },
  { value: 'purple', label: '보라색',  className: 'bg-purple-500' },
  { value: 'orange', label: '주황색',  className: 'bg-orange-500' },
]

interface EventFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  defaultValues?: Event
}

function toLocalDateTimeInput(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm")
}

export default function EventFormModal({ open, onClose, onSaved, defaultValues }: EventFormModalProps) {
  const isEdit = !!defaultValues
  const [allMembers, setAllMembers] = useState<Profile[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { color: 'blue' },
  })

  const loadMembers = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('*').order('name')
    if (data) setAllMembers(data)
  }, [])

  useEffect(() => {
    if (!open) return
    loadMembers()
    if (defaultValues) {
      reset({
        title: defaultValues.title,
        description: defaultValues.description ?? '',
        start_at: toLocalDateTimeInput(defaultValues.start_at),
        end_at: toLocalDateTimeInput(defaultValues.end_at),
        color: defaultValues.color,
      })
      const supabase = createClient()
      supabase.from('event_participants').select('profile_id').eq('event_id', defaultValues.id).then(({ data }) => {
        if (data) setSelectedIds(data.map(p => p.profile_id))
      })
    } else {
      reset({ color: 'blue' })
      setSelectedIds([])
    }
  }, [open, defaultValues, reset, loadMembers])

  const colorValue = watch('color')

  const toggleMember = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const onSubmit = async (data: FormData) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      title: data.title,
      description: data.description || null,
      start_at: new Date(data.start_at).toISOString(),
      end_at: new Date(data.end_at).toISOString(),
      color: data.color,
    }

    let eventId: string
    if (isEdit) {
      const { error } = await supabase.from('events').update(payload).eq('id', defaultValues!.id)
      if (error) { toast.error('수정 실패: ' + error.message); return }
      eventId = defaultValues!.id
    } else {
      const { data: inserted, error } = await supabase.from('events').insert({ ...payload, created_by: user.id }).select().single()
      if (error || !inserted) { toast.error('등록 실패: ' + error?.message); return }
      eventId = inserted.id
    }

    await supabase.from('event_participants').delete().eq('event_id', eventId)
    if (selectedIds.length > 0) {
      await supabase.from('event_participants').insert(selectedIds.map(pid => ({ event_id: eventId, profile_id: pid })))
    }

    toast.success('일정이 ' + (isEdit ? '수정' : '등록') + '되었습니다')
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '일정 수정' : '일정 등록'}</DialogTitle>
          <DialogDescription className="sr-only">일정 정보를 입력하세요</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>제목</Label>
            <Input placeholder="일정 제목" {...register('title')} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>시작</Label>
              <Input type="datetime-local" {...register('start_at')} />
              {errors.start_at && <p className="text-xs text-red-500">{errors.start_at.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>종료</Label>
              <Input type="datetime-local" {...register('end_at')} />
              {errors.end_at && <p className="text-xs text-red-500">{errors.end_at.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>색상</Label>
            <Select value={colorValue} onValueChange={v => setValue('color', v as EventColor)}>
              <SelectTrigger>
                <SelectValue placeholder="색상 선택" />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${c.className}`} />
                      {c.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>설명 (선택)</Label>
            <Textarea placeholder="일정에 대한 설명..." rows={3} {...register('description')} />
          </div>

          <div className="space-y-1.5">
            <Label>참여자 ({selectedIds.length}명 선택)</Label>
            {allMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">등록된 멤버가 없습니다</p>
            ) : (
              <div className="border rounded-lg max-h-44 overflow-y-auto divide-y">
                {allMembers.map(m => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className="rounded accent-blue-600"
                    />
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                        {m.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-none">{m.name}</p>
                      {m.position && <p className="text-xs text-muted-foreground mt-0.5">{m.position}</p>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">취소</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? '저장 중...' : (isEdit ? '수정' : '등록')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
