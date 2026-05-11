'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ArrowLeft, Pin, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Announcement, Profile } from '@/types/database'

export default function AnnouncementDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [annRes, profileRes] = await Promise.all([
      supabase.from('announcements').select('*').eq('id', id).single(),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    if (annRes.data) setAnnouncement(annRes.data)
    if (profileRes.data) setProfile(profileRes.data)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const openEdit = () => {
    if (!announcement) return
    setTitle(announcement.title)
    setContent(announcement.content)
    setPinned(announcement.pinned)
    setEditOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('announcements').update({ title, content, pinned }).eq('id', id)
    if (error) {
      toast.error('저장 실패: ' + error.message)
    } else {
      toast.success('공지사항이 수정되었습니다')
      setEditOpen(false)
      fetchData()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) {
      toast.error('삭제 실패: ' + error.message)
    } else {
      toast.success('삭제되었습니다')
      router.push('/announcements')
    }
    setDeleting(false)
  }

  const isAdmin = profile?.role === 'admin'

  if (!announcement) {
    return (
      <div className="max-w-2xl">
        <div className="h-8 w-32 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-xl border p-8 space-y-4">
          <div className="h-6 w-2/3 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse" />
          <div className="space-y-2 pt-4">
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/announcements')} className="-ml-2">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          목록으로
        </Button>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />수정
            </Button>
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />삭제
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-8">
        <div className="flex items-center gap-2 mb-2">
          {announcement.pinned && <Pin className="w-4 h-4 text-blue-500 shrink-0" />}
          <h1 className="text-xl font-bold">{announcement.title}</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          {format(new Date(announcement.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
        </p>
        <hr className="mb-6" />
        <div
          className="rich-text text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: announcement.content }}
        />
      </div>

      {/* 수정 모달 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>공지사항 수정</DialogTitle>
            <DialogDescription className="sr-only">공지사항 내용을 수정하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>제목</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="공지 제목" />
            </div>
            <div className="space-y-1.5">
              <Label>내용</Label>
              <RichTextEditor key={editOpen ? 'open' : 'closed'} value={content} onChange={setContent} placeholder="공지 내용을 입력하세요..." />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm font-medium">상단 고정</span>
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1">취소</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? '저장 중...' : '수정'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>공지사항 삭제</DialogTitle>
            <DialogDescription>
              &quot;{announcement.title}&quot; 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
