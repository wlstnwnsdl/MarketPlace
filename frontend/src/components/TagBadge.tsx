interface TagBadgeProps {
  tag: string
}

export default function TagBadge({ tag }: TagBadgeProps) {
  return (
    <span className="bg-zinc-100 text-zinc-500 text-xs px-2 py-0.5 rounded-full">
      {tag}
    </span>
  )
}
