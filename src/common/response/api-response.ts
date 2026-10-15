// // src/common/response/api-response.ts
export class ApiResponse<T> {
  data: T;
  message: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  constructor(
    data: T,
    message: string,
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    },
  ) {
    this.data = data;
    this.message = message;
    if (pagination) this.pagination = pagination;
  }
}