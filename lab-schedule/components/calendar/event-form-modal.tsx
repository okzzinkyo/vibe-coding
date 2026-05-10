'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, getDay } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Event, EventColor, Profile, RecurrenceRule } from '@/types/database'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

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

function toLocalDateTimeInput(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm")
}

function generateOccurrences(
  startAt: Date,
  endAt: Date,
  rule: RecurrenceRule,
): Array<{ start: Date; end: Date }> {
  const duration = endAt.getTime() - startAt.getTime()
  const results: Array<{ start: Date; end: Date }> = []
  const sortedDays = [...rule.days].sort((a, b) => a - b)

  const endDate =
    rule.end_type === 'date' && rule.end_date
      ? new Date(rule.end_date + 'T23:59:59')
      : null
  const maxCount = rule.end_type === 'count' ? (rule.end_count ?? 1) : 10000

  // startAt이 속한 주의 일요일 기준으로 계산
  const startDow = getDay(startAt)
  const weekBase = new Date(startAt)
  weekBase.setDate(startAt.getDate() - startDow)
  weekBase.setHours(startAt.getHours(), startAt.getMinutes(), 0, 0)

  outer: for (let w = 0; w < 520; w++) {
    for (const day of sortedDays) {
      if (results.length >= maxCount) break outer

      const occ = new Date(weekBase)
      occ.setDate(weekBase.getDate() + w * 7 + day)

      if (occ < startAt) continue
      if (endDate && occ > endDate) break outer

      results.push({ start: occ, end: new Date(occ.getTime() + duration) })
    }
  }

  return results
}

interface EventFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  defaultValues?: Event
  editScope?: 'single' | 'future'
}

export default function EventFormModal({ open, onClose, onSaved, defaultValues, editScope }: EventFormModalProps) {
  const isEdit = !!defaultValues
  const showRecurrence = !isEdit || editScope === 'future'

  const [allMembers, setAllMembers] = useState<Profile[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [isRecurring, setIsRecurring] = useState(false)
  const [recurDays, setRecurDays] = useState<number[]>([])
  const [recurEndType, setRecurEndType] = useState<'date' | 'count'>('count')
  const [recurEndDate, setRecurEndDate] = useState('')
  const [recurEndCount, setRecurEndCount] = useState(10)

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

      if (defaultValues.recurrence_rule) {
        const rule = defaultValues.recurrence_rule
        setIsRecurring(true)
        setRecurDays(rule.days)
        setRecurEndType(rule.end_type)
        setRecurEndDate(rule.end_date ?? '')
        setRecurEndCount(rule.end_count ?? 10)
      } else {
        setIsRecurring(false)
        setRecurDays([])
        setRecurEndType('count')
        setRecurEndDate('')
        setRecurEndCount(10)
      }
    } else {
      reset({ color: 'blue' })
      setSelectedIds([])
      setIsRecurring(false)
      setRecurDays([])
      setRecurEndType('count')
      setRecurEndDate('')
      setRecurEndCount(10)
    }
  }, [open, defaultValues, reset, loadMembers])

  const colorValue = watch('color')
  const startAtValue = watch('start_at')

  const toggleDay = (day: number) => {
    setRecurDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  const toggleMember = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const onSubmit = async (data: FormData) => {
    if (isRecurring && recurDays.length === 0) {
      toast.error('반복할 요일을 선택하세요')
      return
    }
    if (isRecurring && recurEndType === 'date' && !recurEndDate) {
      toast.error('종료 날짜를 입력하세요')
      return
    }

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

    const isSingleEdit = isEdit && editScope === 'single'
    const isFutureEdit = isEdit && editScope === 'future'

    if (isSingleEdit) {
      const { error } = await supabase.from('events').update(payload).eq('id', defaultValues!.id)
      if (error) { toast.error('수정 실패: ' + error.message); return }

      await supabase.from('event_participants').delete().eq('event_id', defaultValues!.id)
      if (selectedIds.length > 0) {
        await supabase.from('event_participants').insert(selectedIds.map(pid => ({ event_id: defaultValues!.id, profile_id: pid })))
      }
    } else {
      const rule: RecurrenceRule | undefined = isRecurring
        ? {
            days: recurDays,
            end_type: recurEndType,
            ...(recurEndType === 'date' ? { end_date: recurEndDate } : { end_count: recurEndCount }),
          }
        : undefined

      // "이후 전체" 수정 시 기존 이후 일정 삭제
      if (isFutureEdit && defaultValues?.recurrence_group_id) {
        const { error } = await supabase.from('events').delete()
          .eq('recurrence_group_id', defaultValues.recurrence_group_id)
          .gte('start_at', defaultValues.start_at)
        if (error) { toast.error('기존 일정 삭제 실패: ' + error.message); return }
      }

      if (isRecurring && rule) {
        const groupId = isFutureEdit && defaultValues?.recurrence_group_id
          ? defaultValues.recurrence_group_id
          : crypto.randomUUID()

        const occurrences = generateOccurrences(new Date(payload.start_at), new Date(payload.end_at), rule)

        if (occurrences.length === 0) {
          toast.error('반복 조건에 맞는 일정이 없습니다')
          return
        }

        const eventsToInsert = occurrences.map(occ => ({
          ...payload,
          start_at: occ.start.toISOString(),
          end_at: occ.end.toISOString(),
          recurrence_group_id: groupId,
          recurrence_rule: rule,
          created_by: user.id,
        }))

        const { data: inserted, error } = await supabase.from('events').insert(eventsToInsert).select('id')
        if (error) { toast.error('등록 실패: ' + error.message); return }

        if (inserted && selectedIds.length > 0) {
          const participantRows = inserted.flatMap(ev =>
            selectedIds.map(pid => ({ event_id: ev.id, profile_id: pid }))
          )
          await supabase.from('event_participants').insert(participantRows)
        }
      } else {
        const { data: inserted, error } = await supabase.from('events')
          .insert({ ...payload, created_by: user.id })
          .select()
          .single()
        if (error || !inserted) { toast.error('등록 실패: ' + error?.message); return }

        await supabase.from('event_participants').delete().eq('event_id', inserted.id)
        if (selectedIds.length > 0) {
          await supabase.from('event_participants').insert(selectedIds.map(pid => ({ event_id: inserted.id, profile_id: pid })))
        }
      }
    }

    toast.success('일정이 ' + (isEdit ? '수정' : '등록') + '되었습니다')
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? editScope === 'future' ? '이 일정 + 이후 수정' : '일정 수정'
              : '일정 등록'}
          </DialogTitle>
          <DialogDescription className="sr-only">일정 정보를 입력하세요</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2 min-w-0 overflow-hidden">
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
            <Textarea placeholder="일정에 대한 설명..." rows={3} className="resize-none" {...register('description')} />
          </div>

          {/* 반복 설정 */}
          {showRecurrence && (
            <div className="border-t pt-3 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={e => {
                    setIsRecurring(e.target.checked)
                    if (e.target.checked && recurDays.length === 0 && startAtValue) {
                      setRecurDays([getDay(new Date(startAtValue))])
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" />
                  매주 반복
                </span>
              </label>

              {isRecurring && (
                <div className="pl-6 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">반복 요일</p>
                    <div className="flex gap-1">
                      {DAY_LABELS.map((label, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={cn(
                            'w-8 h-8 rounded-full text-xs font-medium transition-colors',
                            recurDays.includes(i)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">종료 조건</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-sm select-none">
                        <input
                          type="radio"
                          checked={recurEndType === 'count'}
                          onChange={() => setRecurEndType('count')}
                          className="w-3.5 h-3.5"
                        />
                        횟수
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-sm select-none">
                        <input
                          type="radio"
                          checked={recurEndType === 'date'}
                          onChange={() => setRecurEndType('date')}
                          className="w-3.5 h-3.5"
                        />
                        날짜
                      </label>
                    </div>
                    {recurEndType === 'count' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={recurEndCount}
                          onChange={e => setRecurEndCount(Number(e.target.value))}
                          className="w-20 h-8 border border-input rounded-lg px-2.5 text-sm outline-none focus-visible:border-ring"
                        />
                        <span className="text-sm text-muted-foreground">회 반복</span>
                      </div>
                    ) : (
                      <Input
                        type="date"
                        value={recurEndDate}
                        onChange={e => setRecurEndDate(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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
