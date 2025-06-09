export interface PagedResponse<T> {
  items: T[];
  meta: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}