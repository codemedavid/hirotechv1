/**
 * Common API types
 */

export interface ApiError {
  error: string;
  details?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Facebook API types
export interface FacebookPage {
  id: string;
  access_token: string;
  name?: string;
  category?: string;
  tasks?: string[];
}

export interface FacebookConversation {
  id: string;
  participants?: {
    data: Array<{
      id: string;
      name?: string;
    }>;
  };
  messages?: {
    data: FacebookMessage[];
  };
}

export interface FacebookMessage {
  id: string;
  from: {
    id: string;
    name?: string;
  };
  to?: {
    data: Array<{
      id: string;
      name?: string;
    }>;
  };
  message?: string;
  created_time: string;
}

export interface FacebookProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  profile_pic?: string;
}

// Database record types
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface DatabaseError extends Error {
  code?: string;
  meta?: JsonValue;
}

