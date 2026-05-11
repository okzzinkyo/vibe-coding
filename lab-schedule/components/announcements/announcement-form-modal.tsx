'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Announcement } from '@/types/database'

interface AnnouncementFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement?: Announcement | null
  onSuccess: () => void
}

export function AnnouncementFormModal({ open, onOpenChange, announcement, onSuccess }: AnnouncementFormModalProps) {
  const isEditing = !!announcement
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(announcement?.title ?? '')
      setContent(announcement?.content ?? '')
      setPinned(announcement?.pinned ?? false)
    }
  }, [open, announcement])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    const supabase = createClient()

    let error
    if (isEditing) {
      ;({ error } = await supabase.from('announcements').update({ title, content, pinned }).eq('id', announcement.id))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSaving(false); return }
      ;({ error } = await supabase.from('announcements').insert({ title, content, pinned, created_by: user.id }))
    }

    if (error) {
      toast.error('저장 실패: ' + error.message)
    } else {
      toast.success(`공지사항이 ${isEditing ? '수정' : '등록'}되었습니다`)
      onOpenChange(false)
      onSuccess()
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEditing ? '공지사항 수정' : '공지사항 작성'}</DialogTitle>
          <DialogDescription className="sr-only">공지사항 내용을 입력하세요</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 overflow-y-auto flex-1">
          <div className="space-y-1.5">
            <Label>제목</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="공지 제목" />
          </div>
          <div className="space-y-1.5">
            <Label>내용</Label>
            <RichTextEditor
              key={open ? (announcement?.id ?? 'new') : 'closed'}
              value={content}
              onChange={setContent}
              placeholder="공지 내용을 입력하세요..."
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm font-medium">상단 고정</span>
          </label>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">취소</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? '저장 중...' : (isEditing ? '수정' : '등록')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
