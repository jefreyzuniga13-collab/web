// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
// import useConversations from '@/Hooks/Conversation/useConversations'

// interface UseConversationHistoryTabOptions {
//   contactId?: number
//   initialPageSize?: number
// }

// export function useConversationHistoryTab({
//   contactId,
//   initialPageSize = 10,
// }: UseConversationHistoryTabOptions) {
//   const {
//     data,
//     page,
//     pageSize,
//     totalCount,
//     loading,
//     error,
//     isModalOpen,
//     selectedConversation,
//     exportConversationHistoryToPDFAsync,
//     GetConversaionContact,
//     setPageSize,
//     openView,
//     closeModal,
//   } = useConversations({
//     initialState: '',
//     initialPage: 1,
//     initialPageSize,
//   })

//   const [convFrom, setConvFrom] = useState<Date | null>(null)
//   const [convTo, setConvTo] = useState<Date | null>(null)
//   const [convQuery, setConvQuery] = useState<string>('')
//   const [showConvFilters, setShowConvFilters] = useState<boolean>(false)

//   const [convItems, setConvItems] = useState<ConversationDto[]>([])
//   const [hasMore, setHasMore] = useState<boolean>(false)
//   const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
//   const [hoverId, setHoverId] = useState<number | null>(null)

//   const sentinelRef = useRef<HTMLDivElement | null>(null)

//   useEffect(() => {
//     setPageSize(initialPageSize)
//   }, [initialPageSize, setPageSize])

//   useEffect(() => {
//     if (!contactId || contactId <= 0) {
//       setConvItems([])
//       setHasMore(false)
//       return
//     }

//     const loadFirstPage = async () => {
//       await GetConversaionContact({
//         contactId,
//         from: convFrom,
//         to: convTo,
//         q: convQuery,
//         page: 1,
//         pageSize: initialPageSize,
//       })
//     }

//     setHasMore(true)
//     loadFirstPage().catch(() => {})
//   }, [contactId, convFrom, convTo, convQuery, initialPageSize, GetConversaionContact])

//   useEffect(() => {
//     if (!contactId || contactId <= 0) {
//       setConvItems([])
//       setHasMore(false)
//       return
//     }

//     if (page === 1) {
//       setConvItems(data ?? [])
//     } else if (page > 1 && data && data.length) {
//       setConvItems(prev => {
//         const existingIds = new Set(prev.map(c => c.conversationId))
//         const fresh = data.filter(c => !existingIds.has(c.conversationId))
//         return [...prev, ...fresh]
//       })
//     }
//   }, [contactId, page, data])

//   useEffect(() => {
//     if (!totalCount) {
//       setHasMore(false)
//       return
//     }
//     setHasMore(convItems.length < totalCount)
//   }, [convItems.length, totalCount])

//   const loadMore = useCallback(async () => {
//     if (!contactId || contactId <= 0) return
//     if (!hasMore) return
//     if (loading || isLoadingMore) return

//     setIsLoadingMore(true)
//     try {
//       await GetConversaionContact({
//         contactId,
//         from: convFrom,
//         to: convTo,
//         q: convQuery,
//         page: page + 1,
//         pageSize,
//       })
//     } finally {
//       setIsLoadingMore(false)
//     }
//   }, [contactId, hasMore, loading, isLoadingMore, GetConversaionContact, convFrom, convTo, convQuery, page, pageSize])

//   useEffect(() => {
//     const node = sentinelRef.current
//     if (!node) return

//     const observer = new IntersectionObserver(
//       entries => {
//         const entry = entries[0]
//         if (entry.isIntersecting) {
//           loadMore().catch(() => {})
//         }
//       },
//       {
//         root: null,
//         rootMargin: '0px',
//         threshold: 1.0,
//       }
//     )

//     observer.observe(node)
//     return () => {
//       observer.disconnect()
//     }
//   }, [loadMore])

//   const convRows = useMemo(() => {
//     if (!convItems?.length) return []
//     return [...convItems].sort((a: any, b: any) => {
//       const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0
//       const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0
//       return db - da
//     })
//   }, [convItems])

//   return {
//     convFrom,
//     setConvFrom,
//     convTo,
//     setConvTo,
//     convQuery,
//     setConvQuery,
//     showConvFilters,
//     setShowConvFilters,
//     convItems,
//     convRows,
//     hoverId,
//     setHoverId,
//     sentinelRef,
//     hasMore,
//     isLoadingMore,
//     loading,
//     error,
//     totalCount,
//     page,
//     pageSize,
//     showHistoryModal: isModalOpen,
//     selectedConversation,
//     openHistory: openView,
//     closeHistory: closeModal,
//     exportConversationHistoryToPDFAsync,
//   }
// }

// export default useConversationHistoryTab