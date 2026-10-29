export interface ApiResponse<TData> {
  success: boolean;
  data: TData;
  timestamp: Date;
  meta?: Record<string, unknown>;
}
