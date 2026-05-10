'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus, Pin, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Announcement, Profile } from '@/types/database'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [annRes, profileRes] = await Promise.all([
      supabase.from('announcements').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    if (annRes.data) setAnnouncements(annRes.data)
    if (profileRes.data) setProfile(profileRes.data)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openNew = () => {
    setEditing(null)
    setTitle('')
    setContent('')
    setPinned(false)
    setModalOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setTitle(a.title)
    setContent(a.content)
    setPinned(a.pinned)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let error
    if (editing) {
      ;({ error } = await supabase.from('announcements').update({ title, content, pinned }).eq('id', editing.id))
    } else {
      ;({ error } = await supabase.from('announcements').insert({ title, content, pinned, created_by: user.id }))
    }

    if (error) {
      toast.error('저장 실패: ' + error.message)
    } else {
      toast.success('공지사항이 ' + (editing ? '수정' : '등록') + '되었습니다')
      setModalOpen(false)
      fetchData()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) return
    const supabase = createClient()
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) {
      toast.error('삭제 실패: ' + error.message)
    } else {
      toast.success('삭제되었습니다')
      fetchData()
    }
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">공지사항</h1>
        {isAdmin && (
          <Button onClick={openNew} size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            공지 작성
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center text-muted-foreground">
            등록된 공지사항이 없습니다
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {a.pinned && <Pin className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                    <h3 className="font-semibold text-base">{a.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {format(new Date(a.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? '공지사항 수정' : '공지사항 작성'}</DialogTitle>
            <DialogDescription className="sr-only">공지사항 내용을 입력하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 min-w-0 overflow-hidden">
            <div className="space-y-1.5">
              <Label>제목</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="공지 제목" />
            </div>
            <div className="space-y-1.5">
              <Label>내용</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="공지 내용..." className="resize-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={e => setPinned(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">상단 고정</span>
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">취소</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? '저장 중...' : (editing ? '수정' : '등록')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
