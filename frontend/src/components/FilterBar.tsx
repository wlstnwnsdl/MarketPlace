import type { PromptType, TargetRole } from '../types'

interface FilterBarProps {
  type: PromptType | undefined
  targetRole: TargetRole | undefined
  keyword?: string
  onTypeChange: (type: PromptType | undefined) => void
  onRoleChange: (role: TargetRole | undefined) => void
  onKeywordChange?: (keyword: string) => void
}

const TYPE_OPTIONS: { label: string; value: PromptType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'CLAUDE.md', value: 'CLAUDE_MD' },
  { label: 'Agent', value: 'AGENT' },
  { label: 'Skill', value: 'SKILL' },
  { label: 'Settings', value: 'SETTINGS' },
  { label: 'Bundle', value: 'BUNDLE' },
]

const ROLE_OPTIONS: { label: string; value: TargetRole | undefined }[] = [
  { label: 'All Roles', value: undefined },
  { label: 'Developer', value: 'DEVELOPER' },
  { label: 'Planner', value: 'PLANNER' },
  { label: 'Designer', value: 'DESIGNER' },
]

export default function FilterBar({ type, targetRole, keyword, onTypeChange, onRoleChange, onKeywordChange }: FilterBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 flex-wrap">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => onTypeChange(opt.value)}
            className={type === opt.value ? 'mp-tab-active' : 'mp-tab-inactive'}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {ROLE_OPTIONS.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => onRoleChange(opt.value)}
            className={targetRole === opt.value ? 'mp-tab-active' : 'mp-tab-inactive'}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {onKeywordChange !== undefined && (
        <input
          type="text"
          placeholder="Search..."
          value={keyword ?? ''}
          onChange={(e) => onKeywordChange(e.target.value)}
          className="w-full rounded-lg bg-white border border-zinc-200 px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
        />
      )}
    </div>
  )
}
