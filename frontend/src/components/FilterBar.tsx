import type { PromptType, TargetRole } from '../types'

interface FilterBarProps {
  type: PromptType | undefined
  targetRole: TargetRole | undefined
  onTypeChange: (type: PromptType | undefined) => void
  onRoleChange: (role: TargetRole | undefined) => void
}

const TYPE_OPTIONS: { label: string; value: PromptType | undefined }[] = [
  { label: '전체', value: undefined },
  { label: 'CLAUDE.md', value: 'CLAUDE_MD' },
  { label: 'Agent', value: 'AGENT' },
  { label: 'Skill', value: 'SKILL' },
  { label: 'Settings', value: 'SETTINGS' },
  { label: 'Bundle', value: 'BUNDLE' },
]

const ROLE_OPTIONS: { label: string; value: TargetRole | undefined }[] = [
  { label: '전체', value: undefined },
  { label: '개발자', value: 'DEVELOPER' },
  { label: '기획자', value: 'PLANNER' },
  { label: '디자이너', value: 'DESIGNER' },
]

export default function FilterBar({ type, targetRole, onTypeChange, onRoleChange }: FilterBarProps) {
  return (
    <div className="w-48 shrink-0 space-y-6">
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">타입</p>
        <div className="flex flex-col gap-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => onTypeChange(opt.value)}
              className={
                type === opt.value
                  ? 'rounded-md bg-neutral-800 text-white px-3 py-1.5 text-sm font-medium text-left'
                  : 'text-neutral-500 hover:text-neutral-300 px-3 py-1.5 text-sm transition-colors text-left'
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">역할</p>
        <div className="flex flex-col gap-1">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => onRoleChange(opt.value)}
              className={
                targetRole === opt.value
                  ? 'rounded-md bg-neutral-800 text-white px-3 py-1.5 text-sm font-medium text-left'
                  : 'text-neutral-500 hover:text-neutral-300 px-3 py-1.5 text-sm transition-colors text-left'
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
