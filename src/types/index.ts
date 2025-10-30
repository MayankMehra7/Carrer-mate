// Export all types from individual modules
export * from './editor';
export * from './resume';
export * from './template';

// Common utility types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Common UI types
export interface Dimensions {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
}

// Event types
export interface ChangeEvent<T = any> {
  field: string;
  value: T;
  previousValue?: T;
}

export interface SelectionEvent {
  sectionId: string;
  itemId?: string;
}

export interface NavigationEvent {
  from: string;
  to: string;
  data?: any;
}