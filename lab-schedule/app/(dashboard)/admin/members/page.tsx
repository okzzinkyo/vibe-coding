'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Shield, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile, UserRole } from '@/types/database'

export default function MembersPage() {
  const [members, setMembers] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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
                <Avatar className="w-9 h-9">
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
                  <p className="text-xs text-muted-foreground mt-0.5">
                    가입: {format(new Date(member.created_at), 'yyyy.MM.dd', { locale: ko })}
                  </p>
                </div>

                <Select
                  value={member.role}
                  onValueChange={(v) => handleRoleChange(member.id, v as UserRole)}
                  disabled={updatingId === member.id || member.id === currentUser?.id}
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
