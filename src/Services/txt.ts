async getRatingConversation(
  page: number,
  pageSize: number,
  filters: FilterForm,
  agentId?: number
): Promise<PagedResponse<ConversationDto>> {
  const { data } = await api.get<ApiResponse<PagedResponse<ConversationDto>>>(
    "/Conversations/ratingConversation",
    {
      params: {
        // PaginationParams dentro de RatingFilter.Params
        "Params.PageNumber": page,
        "Params.PageSize": pageSize,

        // AgentId dentro de RatingFilter.AgentId
        AgentId: agentId ?? 0,

        // FilterDashboard dentro de RatingFilter.Filters
        "Filters.From": filters.from,
        "Filters.To": filters.to,
        "Filters.Status": filters.status,
      },
    }
  );

  return data.data;
}
