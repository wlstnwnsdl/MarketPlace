interface PromptPreviewProps {
  content: string
  purchased?: boolean
}

export default function PromptPreview({ content, purchased = false }: PromptPreviewProps) {
  return (
    <div className="relative">
      <div className="relative rounded-md bg-[#0d0d0d] border border-neutral-800 p-4 font-mono text-sm text-neutral-300 leading-relaxed max-h-64 overflow-hidden">
        <pre className="whitespace-pre-wrap break-words">{content}</pre>
        {!purchased && (
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0d0d0d]" />
        )}
      </div>
      {!purchased && (
        <p className="mt-2 text-xs text-neutral-500 text-center">
          구매 후 전체 내용을 확인할 수 있습니다
        </p>
      )}
    </div>
  )
}
