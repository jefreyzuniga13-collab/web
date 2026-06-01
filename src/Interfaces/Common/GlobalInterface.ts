export interface PagedResponse<T> {
  items: T[];
  meta: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}


export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  loadingText?: string;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  maxHeight?: string;
  className?: string;
}


  export type StateTranslation =
  | 'Incomplete'
  | 'Human'
  | 'Closed'
  | 'Waiting'
  | 'Bot'
  | 'Paused'


    export type TemplateCategoryTranslation =
  | 'Utility'
  | 'Marketing'
  | 'Authentication'
  | "Service"


  
export const MODAL_MODE = {
  CREATE: "CREATE",
  EDIT: "EDIT",
  VIEW: "VIEW",
} as const;


export type ModalMode = 'create' | 'edit' | 'view'