import { FileText, X, Pencil, Trash2 } from 'lucide-react'
import type { Item } from '@/lib/supabase'

type Props = {
  item: Item
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function ItemDetailSheet({ item, onClose, onEdit, onDelete }: Props) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">카테고리</span>
            {item.category ? (
              <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">{item.category}</span>
            ) : (
              <span className="text-sm text-gray-300">—</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">수량</span>
            <span className={`font-bold ${item.quantity === 0 ? 'text-red-500' : 'text-gray-900'}`}>
              {item.quantity}개
            </span>
          </div>
          {item.image_url && (
            <div>
              <span className="text-sm text-gray-500 block mb-1">사진</span>
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
              />
            </div>
          )}
          {item.description && (
            <div>
              <span className="text-sm text-gray-500 block mb-1">설명</span>
              <p className="text-sm text-gray-700">{item.description}</p>
            </div>
          )}
          {item.file_urls?.length ? (
            <div>
              <span className="text-sm text-gray-500 block mb-1">첨부파일</span>
              <div className="space-y-1">
                {item.file_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    <FileText size={13} />
                    <span className="truncate">{decodeURIComponent(url.split('/').pop() ?? `파일 ${i + 1}`)}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition"
          >
            <Pencil size={15} />
            수정
          </button>
          <button
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-xl py-2.5 text-sm font-medium hover:bg-red-100 transition"
          >
            <Trash2 size={15} />
            삭제
          </button>
        </div>
      </div>
    </>
  )
}
