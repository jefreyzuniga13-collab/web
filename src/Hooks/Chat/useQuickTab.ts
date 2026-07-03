// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useCallback, useMemo, useState } from "react"

// const parseQuickOptions = (selectedParam: unknown): string[] => {
//   const p: any = selectedParam

//   const split = (s: string) =>
//     String(s)
//       .split("|")
//       .map((x) => x.trim())
//       .filter(Boolean)

//   if (Array.isArray(p)) {
//     return p
//       .filter((v: any) => typeof v === "string")
//       .map((v: any) => v.trim())
//       .filter(Boolean)
//   }

//   if (typeof p === "string") {
//     const raw = p.trim()

//     if (raw.startsWith("[") && raw.endsWith("]")) {
//       try {
//         const parsed = JSON.parse(raw)

//         if (Array.isArray(parsed)) {
//           return parsed
//             .filter((v: any) => typeof v === "string")
//             .map((v: any) => v.trim())
//             .filter(Boolean)
//         }
//       } catch {
//         return split(raw)
//       }
//     }

//     return split(raw)
//   }

//   if (typeof p?.value === "string") {
//     const raw = p.value.trim()

//     if (raw.startsWith("[") && raw.endsWith("]")) {
//       try {
//         const parsed = JSON.parse(raw)

//         if (Array.isArray(parsed)) {
//           return parsed
//             .filter((v: any) => typeof v === "string")
//             .map((v: any) => v.trim())
//             .filter(Boolean)
//         }
//       } catch {
//         return split(raw)
//       }
//     }

//     return split(raw)
//   }

//   if (Array.isArray(p?.value)) {
//     return p.value
//       .filter((v: any) => typeof v === "string")
//       .map((v: any) => v.trim())
//       .filter(Boolean)
//   }

//   return []
// }

// export const useQuickTab = (
//   selectedParam: unknown,
//   onSendNow?: (txt: string) => void | Promise<void>
// ) => {
//   const quickOptions = useMemo(() => {
//     const raw = parseQuickOptions(selectedParam)
//     return Array.from(new Set(raw.map((s) => s.trim()))).filter(Boolean)
//   }, [selectedParam])

//   const [qQuick, setQQuick] = useState("")

//   const filteredQuick = useMemo(() => {
//     const search = qQuick.trim().toLowerCase()

//     if (!search) return quickOptions

//     return quickOptions.filter((option) =>
//       option.toLowerCase().includes(search)
//     )
//   }, [quickOptions, qQuick])

//   const handleSendQuick = useCallback(
//     async (txt: string) => {
//       const cleanText = txt.trim()

//       if (!cleanText) return

//       if (onSendNow) {
//         await onSendNow(cleanText)
//         return
//       }

//       const w = window as any

//       if (typeof w.__CHAT_SEND_QUICK__ === "function") {
//         w.__CHAT_SEND_QUICK__(cleanText)
//         return
//       }

//       window.dispatchEvent(
//         new CustomEvent("chat:sendQuick", {
//           detail: {
//             text: cleanText,
//           },
//         })
//       )
//     },
//     [onSendNow]
//   )

//   return {
//     quickOptions,
//     qQuick,
//     setQQuick,
//     filteredQuick,
//     handleSendQuick,
//   }
// }

// export default useQuickTab