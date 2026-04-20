interface TagBadgeProps {
  tag: string
}

export default function TagBadge({ tag }: TagBadgeProps) {
  return (
    <span className="rounded-full bg-neutral-800 text-neutral-400 px-2 py-0.5 text-xs">
      {tag}
    </span>
  )
}
