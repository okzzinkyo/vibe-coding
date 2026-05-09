import { useState, useEffect, useCallback } from 'react'
import { supabase, type Item, type Category } from '@/lib/supabase'
import ItemForm from '@/components/ItemForm'
import CategoryModal from '@/components/CategoryModal'
import ItemDetailSheet from '@/components/ItemDetailSheet'
import { Plus, Search, LogOut, Pencil, Trash2, Package, FileText, Tags, Download } from 'lucide-react'
import ExcelJS from 'exceljs'

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<Item | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('items').select('*').order('name')
    if (search) query = query.ilike('name', `%${search}%`)
    if (categoryFilter) query = query.eq('category', categoryFilter)
    const { data } = await query
    setItems(data ?? [])
    setLoading(false)
  }, [search, categoryFilter])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data ?? [])
  }

  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => { fetchCategories() }, [])

  async function handleDelete(id: string) {
    await supabase.from('items').delete().eq('id', id)
    setDeleteConfirm(null)
    fetchItems()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  async function handleExcelDownload() {
    const { data } = await supabase.from('items').select('*').order('name')
    const rows = data ?? []

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('재고 현황')

    sheet.columns = [
      { header: '물품명', key: 'name', width: 25 },
      { header: '카테고리', key: 'category', width: 15 },
      { header: '수량', key: 'quantity', width: 10 },
      { header: '설명', key: 'description', width: 40 },
      { header: '최종 수정일', key: 'updated_at', width: 20 },
    ]

    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F0FE' },
    }

    rows.forEach(item => {
      sheet.addRow({
        name: item.name,
        category: item.category ?? '',
        quantity: item.quantity,
        description: item.description ?? '',
        updated_at: new Date(item.updated_at).toLocaleDateString('ko-KR'),
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `재고현황_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Lab Inventory</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="물품 검색..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white text-gray-700 transition"
            >
              <option value="">전체 카테고리</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <button
              onClick={() => setShowCategoryModal(true)}
              title="카테고리 관리"
              className="flex items-center justify-center border border-gray-300 rounded-xl px-3 py-2.5 text-gray-500 hover:text-gray-700 hover:border-gray-400 bg-white transition"
            >
              <Tags size={16} />
            </button>
          </div>
          <button
            onClick={() => { setEditItem(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap"
          >
            <Plus size={16} />
            물품 추가
          </button>
        </div>
        <div className="flex justify-end mb-3">
          <button
            onClick={handleExcelDownload}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 transition hover:border-gray-300"
          >
            <Download size={13} />
            엑셀 다운로드
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">물품이 없습니다. 추가해보세요!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 font-medium">
                  <th className="hidden sm:table-cell px-4 py-3">카테고리</th>
                  <th className="px-4 py-3">물품명</th>
                  <th className="px-4 py-3 text-right">수량</th>
                  <th className="hidden sm:table-cell px-4 py-3">설명</th>
                  <th className="hidden sm:table-cell px-4 py-3">첨부파일</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                  >
                    <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                      {item.category ? (
                        <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">
                          {item.category}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 font-medium text-gray-900 sm:cursor-default cursor-pointer hover:text-blue-600 sm:hover:text-gray-900 transition-colors"
                      onClick={() => setDetailItem(item)}
                    >{item.name}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <span className={`font-bold ${item.quantity === 0 ? 'text-red-500' : 'text-gray-900'}`}>
                        {item.quantity}
                      </span>
                      <span className="text-xs text-gray-400 ml-0.5">개</span>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-gray-500 max-w-xs truncate">{item.description ?? '—'}</td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      {item.file_urls?.length ? (
                        <div className="flex flex-col gap-1">
                          {item.file_urls.map((url, j) => (
                            <a
                              key={j}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <FileText size={11} />
                              <span className="truncate max-w-32">{decodeURIComponent(url.split('/').pop() ?? `파일 ${j + 1}`)}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => { setEditItem(item); setShowForm(true) }}
                          className="text-gray-400 hover:text-blue-600 transition"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onChanged={fetchCategories}
        />
      )}

      {(showForm) && (
        <ItemForm
          item={editItem}
          onClose={() => { setShowForm(false); setEditItem(null) }}
          onSaved={() => { setShowForm(false); setEditItem(null); fetchItems() }}
        />
      )}

      {detailItem && (
        <ItemDetailSheet
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={() => { setEditItem(detailItem); setShowForm(true); setDetailItem(null) }}
          onDelete={() => { setDeleteConfirm(detailItem.id); setDetailItem(null) }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-2">물품을 삭제하시겠어요?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제하면 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-2 text-sm font-medium hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 text-sm font-medium transition"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
