'use client'

import { useEditor, EditorContent, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import Link from '@tiptap/extension-link'
import { Bold, Italic, List, ListOrdered, Link2, Link2Off } from 'lucide-react'
import { cn } from '@/lib/utils'

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: { chain: () => { setMark: (...args: unknown[]) => { run: () => boolean } } }) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: { chain: () => { setMark: (...args: unknown[]) => { removeEmptyTextStyle: () => { run: () => boolean } } } }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    } as never
  },
})

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px']

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      Link.configure({
        autolink: true,
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'rich-text min-h-[120px] px-3 py-2 text-sm focus:outline-none',
      },
    },
    onUpdate({ editor }) {
      const html = editor.isEmpty ? '' : editor.getHTML()
      onChange(html)
    },
  })

  if (!editor) return null

  const currentFontSize = editor.getAttributes('textStyle').fontSize ?? '14px'

  const handleSetLink = () => {
    const prev = editor.getAttributes('link').href ?? ''
    const url = window.prompt('링크 URL을 입력하세요', prev)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const tools = [
    { icon: Bold, label: '굵게', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
    { icon: Italic, label: '기울임', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
    { icon: List, label: '글머리 기호', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
    { icon: ListOrdered, label: '번호 목록', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
    { icon: editor.isActive('link') ? Link2Off : Link2, label: editor.isActive('link') ? '링크 제거' : '링크 추가', action: handleSetLink, active: editor.isActive('link') },
  ]

  return (
    <div className="rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
      <div className="flex items-center gap-0.5 border-b px-1.5 py-1">
        {tools.map(({ icon: Icon, label, action, active }) => (
          <button
            key={label}
            type="button"
            title={label}
            onClick={action}
            className={cn(
              'rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
              active && 'bg-muted text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-border" />
        <select
          value={currentFontSize}
          onChange={e => editor.chain().focus().setFontSize(e.target.value).run()}
          className="rounded px-1.5 py-1 text-xs text-muted-foreground bg-transparent hover:bg-muted hover:text-foreground transition-colors cursor-pointer focus:outline-none"
        >
          {FONT_SIZES.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>
      <div className="relative">
        {editor.isEmpty && !editor.isActive('bulletList') && !editor.isActive('orderedList') && placeholder && (
          <p className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
