export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface KafkaEvent<T = unknown> {
  eventType: string;
  payload: T;
  timestamp: string;
  serviceSource: string;
}
