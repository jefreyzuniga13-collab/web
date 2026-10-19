import "@/Styles/Common/ListSkeleton.css"

export type ListSkeletonVariant =
  | "list"
  | "message"
  | "product"
  | "detail"
  | "cart"

interface ListSkeletonProps {
  variant?: ListSkeletonVariant
  count?: number
  className?: string
  asItems?: boolean
}

export default function ListSkeleton({
  variant = "list",
  count = 8,
  className = "",
  asItems = false,
}: ListSkeletonProps) {
  const rows = Array.from({ length: count }, (_, index) => {
    const outgoing = variant === "message" && index % 2 === 1
    const row = (
      <div
        key={index}
        className={`list-skeleton__row list-skeleton__row--${variant}${
          outgoing ? " list-skeleton__row--outgoing" : ""
        }`}
      >
        <span className="list-skeleton__media" />
        <div className="list-skeleton__lines">
          <span className="list-skeleton__bar list-skeleton__bar--title" />
          <span className="list-skeleton__bar list-skeleton__bar--subtitle" />
          {(variant === "detail" || variant === "cart") && (
            <span className="list-skeleton__bar list-skeleton__bar--extra" />
          )}
        </div>
      </div>
    )

    if (!asItems) return row

    return (
      <li key={index} className="list-skeleton__item">
        {row}
      </li>
    )
  })

  if (asItems) {
    return <>{rows}</>
  }

  return (
    <div
      className={`list-skeleton list-skeleton--${variant} ${className}`.trim()}
      aria-hidden
    >
      {rows}
    </div>
  )
}
