export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    pagination?: Pagination;
    filters?: Record<string, string[]>;
}
export interface Pagination {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
