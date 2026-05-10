'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Shield, User, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile, UserRole } from '@/types/database'

export default function MembersPage() {
  const [members, setMembers] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [editForm, setEditForm] = useState({ position: '', phone: '' })
  const [editSaving, setEditSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [membersRes, profileRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ])
    if (membersRes.data) setMembers(membersRes.data)
    if (profileRes.data) setCurrentUser(profileRes.data)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    setUpdatingId(memberId)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', memberId)
    if (error) {
      toast.error('권한 변경 실패: ' + error.message)
    } else {
      toast.success('권한이 변경되었습니다')
      fetchData()
    }
    setUpdatingId(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('삭제 실패: ' + error.message)
    } else {
      toast.success(`${deleteTarget.name} 멤버가 삭제되었습니다`)
      setDeleteTarget(null)
      fetchData()
    }
    setDeletingId(null)
  }

  const openEdit = (member: Profile) => {
    setEditTarget(member)
    setEditForm({ position: member.position ?? '', phone: member.phone ?? '' })
  }

  const handleEditSave = async () => {
    if (!editTarget) return
    setEditSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      position: editForm.position || null,
      phone: editForm.phone || null,
    }).eq('id', editTarget.id)
    if (error) {
      toast.error('저장 실패: ' + error.message)
    } else {
      toast.success('정보가 저장되었습니다')
      setEditTarget(null)
      fetchData()
    }
    setEditSaving(false)
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">관리자 권한이 필요합니다</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">멤버 관리</h1>
        <Badge variant="secondary">{members.length}명</Badge>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {members.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">멤버가 없습니다</p>
        ) : (
          <ul className="divide-y">
            {members.map(member => (
              <li key={member.id} className="flex items-center gap-4 px-5 py-4">
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarFallback className="text-sm font-medium bg-blue-100 text-blue-700">
                    {member.name.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{member.name}</p>
                    {member.id === currentUser?.id && (
                      <span className="text-xs text-muted-foreground">(나)</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {member.position && (
                      <span className="text-xs text-blue-600 font-medium">{member.position}</span>
                    )}
                    {member.phone && (
                      <span className="text-xs text-muted-foreground">{member.phone}</span>
                    )}
                    {!member.position && !member.phone && (
                      <span className="text-xs text-muted-foreground">직책/연락처 미입력</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    가입: {format(new Date(member.created_at), 'yyyy.MM.dd', { locale: ko })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => openEdit(member)}
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTarget(member)}
                    disabled={deletingId === member.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>

                  <Select
                    value={member.role}
                    onValueChange={(v) => handleRoleChange(member.id, v as UserRole)}
                    disabled={updatingId === member.id}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-blue-500" />
                          관리자
                        </div>
                      </SelectItem>
                      <SelectItem value="member">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-gray-400" />
                          멤버
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>멤버 삭제</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{deleteTarget?.name}</span> 멤버를 삭제하시겠습니까?
              <br />
              삭제 후 해당 계정은 서비스에 접근할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!!deletingId}>
              {deletingId ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget?.name} 정보 수정</DialogTitle>
            <DialogDescription className="sr-only">직책과 연락처를 수정합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 min-w-0 overflow-hidden">
            <div className="space-y-1.5">
              <Label>직책/역할</Label>
              <Input
                placeholder="예: 교수, 박사과정, 석사과정"
                value={editForm.position}
                onChange={e => setEditForm(f => ({ ...f, position: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>연락처</Label>
              <Input
                placeholder="010-0000-0000"
                value={editForm.phone}
                onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditTarget(null)} className="flex-1">취소</Button>
              <Button onClick={handleEditSave} disabled={editSaving} className="flex-1">
                {editSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
