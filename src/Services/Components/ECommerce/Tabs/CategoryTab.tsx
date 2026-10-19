import { memo, useCallback } from "react"
import type { KeyboardEvent } from "react"
import Tooltip from "@mui/material/Tooltip"

import type { CategoriaPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import type { SelectedInterface } from "./ProductTab"
import vacio from "@/assets/vacio.png"

import "@/Styles/Chat/DetailPanel/CategoryRow.css"

interface Props {
  cat?: CategoriaPCGInterface
  setselectedCategory: (
    category: SelectedInterface
  ) => void
}

const CategoryTabComponent = ({
  cat,
  setselectedCategory,
}: Props) => {
  const selectCategory = useCallback(() => {
    const codGrupo = cat?.codGrupo ?? null
    const grupo = cat?.grupo ?? null

    if (!codGrupo && !grupo) {
      return
    }

    setselectedCategory({
      codGrupo,
      grupo,
    })
  }, [
    cat?.codGrupo,
    cat?.grupo,
    setselectedCategory,
  ])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (
        event.key !== "Enter" &&
        event.key !== " "
      ) {
        return
      }

      event.preventDefault()
      selectCategory()
    },
    [selectCategory]
  )

  const categoryName =
    String(cat?.grupo ?? "").trim() ||
    "Categoría"

  return (
    <div
      className="category-row"
      role="button"
      tabIndex={0}
      aria-label={`Abrir categoría ${categoryName}`}
      onClick={selectCategory}
      onKeyDown={handleKeyDown}
    >
      <div className="category-row__image">
        <img
          src={cat?.imagen || vacio}
          alt={categoryName}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="category-image"
        />
      </div>

      <span className="category-row__label">
        <Tooltip title={categoryName}>
          <span>{cat?.grupo ?? ""}</span>
        </Tooltip>
      </span>
    </div>
  )
}

export const CategoryTab = memo(
  CategoryTabComponent
)