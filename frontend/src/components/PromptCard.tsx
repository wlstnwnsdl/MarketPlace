import type { PromptSummary, PromptType, TargetRole } from '../types'

interface PromptCardProps {
  prompt: PromptSummary
  onClick: () => void
}

const TYPE_LABEL: Record<PromptType, string> = {
  CLAUDE_MD: 'CLAUDE.md',
  AGENT: 'Agent',
  SKILL: 'Skill',
  SETTINGS: 'Settings',
  BUNDLE: 'Bundle',
}

const ROLE_LABEL: Record<TargetRole, string> = {
  DEVELOPER: 'Developer',
  PLANNER: 'Planner',
  DESIGNER: 'Designer',
  PM: 'PM',
  MARKETER: 'Marketer',
  SALES: 'Sales',
}

const TYPE_ICON_BG: Record<PromptType, string> = {
  CLAUDE_MD: 'bg-amber-50 text-amber-700',
  AGENT: 'bg-blue-50 text-blue-700',
  SKILL: 'bg-green-50 text-green-700',
  SETTINGS: 'bg-zinc-100 text-zinc-600',
  BUNDLE: 'bg-purple-50 text-purple-700',
}

function TypeIcon({ type }: { type: PromptType }) {
  if (type === 'CLAUDE_MD') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    )
  }
  if (type === 'AGENT') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }
  if (type === 'SKILL') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
      </svg>
    )
  }
  if (type === 'SETTINGS') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )
  }
  // BUNDLE
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 2,7 12,12 22,7 12,2" />
      <polyline points="2,17 12,22 22,17" />
      <polyline points="2,12 12,17 22,12" />
    </svg>
  )
}

export default function PromptCard({ prompt, onClick }: PromptCardProps) {
  const subLabel = [
    TYPE_LABEL[prompt.type],
    prompt.targetRole ? ROLE_LABEL[prompt.targetRole] : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div onClick={onClick} className="mp-card p-5 cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <div className={`rounded-lg w-10 h-10 flex items-center justify-center shrink-0 ${TYPE_ICON_BG[prompt.type]}`}>
          <TypeIcon type={prompt.type} />
        </div>
        {prompt.price === 0 ? (
          <span className="mp-badge-free">Free</span>
        ) : (
          <span className="mp-badge-paid">₩{prompt.price.toLocaleString()}</span>
        )}
      </div>

      <h3 className="text-base font-semibold text-zinc-900 mt-3 leading-snug">{prompt.title}</h3>
      {subLabel && (
        <p className="text-xs text-zinc-400 mt-0.5">{subLabel}</p>
      )}
      <p className="text-sm text-zinc-500 mt-2 line-clamp-2 leading-relaxed">{prompt.description}</p>

      <div className="border-t border-zinc-100 mt-4 pt-4">
        <button className="mp-btn-terminal w-full justify-center">
          <span>&gt; marketplace get {prompt.id}</span>
        </button>
      </div>
    </div>
  )
}
