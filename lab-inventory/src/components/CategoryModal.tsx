import { useState, useEffect } from 'react'
import { supabase, type Category } from '@/lib/supabase'
import { X, Plus, Trash2 } from 'lucide-react'

type Props = {
  onClose: () => void
  onChanged: () => void
}

export default function CategoryModal({ onClose, onChanged }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data ?? [])
  }

  useEffect(() => { fetchCategories() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.from('categories').insert({ name: newName.trim() })
    if (error) {
      setError(error.code === '23505' ? '이미 존재하는 카테고리예요' : error.message)
    } else {
      setNewName('')
      await fetchCategories()
      onChanged()
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('categories').delete().eq('id', id)
    await fetchCategories()
    onChanged()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">카테고리 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="새 카테고리 이름"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
            <button
              type="submit"
              disabled={loading || !newName.trim()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-sm font-medium transition"
            >
              <Plus size={15} />
              추가
            </button>
          </form>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <ul className="space-y-1 max-h-64 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">카테고리가 없습니다</p>
            ) : (
              categories.map(cat => (
                <li key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                  <span className="text-sm text-gray-700">{cat.name}</span>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
