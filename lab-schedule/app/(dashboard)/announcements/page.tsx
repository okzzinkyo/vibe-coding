'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plus, Pin, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AnnouncementFormModal } from '@/components/announcements/announcement-form-modal'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Announcement, Profile } from '@/types/database'

function normalizePreview(html: string) {
  return html
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1')
    .replace(/font-size:[^;";]*(;)?/g, '')
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  const openNew = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (a: Announcement) => { setEditing(a); setModalOpen(true) }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('announcements').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('삭제 실패: ' + error.message)
    } else {
      toast.success('삭제되었습니다')
      setDeleteTarget(null)
      fetchData()
    }
    setDeleting(false)
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
            <div
              key={a.id}
              className="bg-white rounded-xl border p-5 cursor-pointer hover:border-gray-300 transition-colors"
              onClick={() => router.push(`/announcements/${a.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {a.pinned && <Pin className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                    <h3 className="font-semibold text-base">{a.title}</h3>
                  </div>
                  <div
                    className="rich-text text-sm text-gray-600 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: normalizePreview(a.content) }}
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    {format(new Date(a.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => setDeleteTarget(a)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <AnnouncementFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        announcement={editing}
        onSuccess={fetchData}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>공지사항 삭제</DialogTitle>
            <DialogDescription>
              &quot;{deleteTarget?.title}&quot; 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
