interface PromptPreviewProps {
  content: string
  purchased?: boolean
}

export default function PromptPreview({ content, purchased = false }: PromptPreviewProps) {
  return (
    <div className="relative">
      <div className="relative rounded-lg bg-zinc-50 border border-zinc-200 p-4 font-mono text-sm text-zinc-700 leading-relaxed max-h-60 overflow-hidden">
        <pre className="whitespace-pre-wrap break-words">{content}</pre>
        {!purchased && (
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-zinc-50" />
        )}
      </div>
      {!purchased && (
        <p className="mt-2 text-xs text-zinc-400 text-center">
          구매 후 전체 내용을 확인할 수 있습니다
        </p>
      )}
    </div>
  )
}
