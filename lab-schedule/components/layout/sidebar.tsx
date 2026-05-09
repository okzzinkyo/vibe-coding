'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Calendar, Megaphone, Users, LogOut, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

const navItems = [
  { href: '/', label: '캘린더', icon: Calendar },
  { href: '/announcements', label: '공지사항', icon: Megaphone },
  { href: '/admin/members', label: '멤버 관리', icon: Users, adminOnly: true },
]

interface SidebarProps {
  profile: Profile
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('로그아웃 되었습니다')
    router.push('/login')
    router.refresh()
  }

  const items = navItems.filter(item => !item.adminOnly || profile.role === 'admin')

  return (
    <aside className="w-60 h-screen bg-white border-r flex flex-col fixed left-0 top-0 z-10">
      <div className="px-6 py-5 border-b">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-lg">Lab Schedule</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t space-y-3">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-gray-900">{profile.name}</p>
          <p className="text-xs text-gray-500">{profile.email}</p>
          <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {profile.role === 'admin' ? '관리자' : '멤버'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
