import type { PromptSummary, PromptType } from '../types'
import TagBadge from './TagBadge'

interface PromptCardProps {
  prompt: PromptSummary
  onClick: () => void
}

const TYPE_BADGE: Record<PromptType, string> = {
  CLAUDE_MD: 'bg-amber-900/20 text-amber-400 border border-amber-900',
  AGENT: 'bg-blue-900/20 text-blue-400 border border-blue-900',
  SKILL: 'bg-green-900/20 text-green-400 border border-green-900',
  SETTINGS: 'bg-neutral-800 text-neutral-400 border border-neutral-700',
  BUNDLE: 'bg-purple-900/20 text-purple-400 border border-purple-900',
}

const TYPE_LABEL: Record<PromptType, string> = {
  CLAUDE_MD: 'CLAUDE.md',
  AGENT: 'Agent',
  SKILL: 'Skill',
  SETTINGS: 'Settings',
  BUNDLE: 'Bundle',
}

export default function PromptCard({ prompt, onClick }: PromptCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-lg bg-[#141414] border border-neutral-800 p-4 hover:border-neutral-700 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[prompt.type]}`}>
          {TYPE_LABEL[prompt.type]}
        </span>
        <span className="text-sm font-semibold text-amber-500 shrink-0">
          {prompt.price === 0 ? (
            <span className="text-green-500">무료</span>
          ) : (
            `₩${prompt.price.toLocaleString()}`
          )}
        </span>
      </div>

      <h3 className="text-sm font-medium text-white leading-snug mb-1">{prompt.title}</h3>
      <p className="text-xs text-neutral-400 line-clamp-2 mb-3">{prompt.description}</p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {prompt.tags.slice(0, 3).map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
        <span className="text-xs text-neutral-500 shrink-0">
          ↓ {prompt.downloadCount.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
