import type { ReactNode } from "react"
import { useSelector } from "react-redux"
import {
  selectIsAdmin,
  selectIsCallCenter,
  selectIsRoot
} from "@/Context/Slices/Auth/authSlice"
import "@/Styles/Crm/OpeningHourPage.css"

interface Props {
  title: string
  children: ReactNode
}

/** Solo administradores de empresas con call center activo. */
export default function CallCenterGuard({ title, children }: Props) {
  const isCallCenter = useSelector(selectIsCallCenter)
  const isAdmin = useSelector(selectIsAdmin)
  const isRoot = useSelector(selectIsRoot)

  if (isCallCenter && (isAdmin || isRoot)) return <>{children}</>

  return (
    <div className="oh-page__container">
      <div className="oh-page__header-content">
        <h1 className="oh-page__title">{title}</h1>
        <p className="oh-page__subtitle">
          {isCallCenter
            ? "Solo un administrador puede usar esta pantalla."
            : "Esta empresa no tiene activo el parámetro de call center."}
        </p>
      </div>
    </div>
  )
}
