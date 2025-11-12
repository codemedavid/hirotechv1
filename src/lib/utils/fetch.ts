/**
 * Safe fetch wrapper that handles JSON parsing errors gracefully
 * Use this instead of fetch() + .json() to avoid "Unexpected token '<'" errors
 */

export interface FetchResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Safely fetch and parse JSON response
 * Handles cases where server returns HTML instead of JSON
 */
export async function fetchJSON<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<FetchResponse<T>> {
  try {
    const response = await fetch(url, options);
    
    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      // Response is not JSON (likely HTML error page)
      await response.text();
      
      return {
        ok: false,
        status: response.status,
        error: response.ok 
          ? 'Server returned non-JSON response' 
          : `Request failed with status ${response.status}`,
      };
    }

    // Safe to parse as JSON
    const data = await response.json() as T;

    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? data : undefined,
      error: !response.ok ? ((data as { error?: string; message?: string }).error || (data as { message?: string }).message || 'Request failed') : undefined,
    };
  } catch (error: unknown) {
    console.error('Fetch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
    
    return {
      ok: false,
      status: 0,
      error: errorMessage,
    };
  }
}

/**
 * Fetch with automatic error toast
 * Use in components with toast support
 */
export async function fetchWithToast<T = unknown>(
  url: string,
  options?: RequestInit,
  errorMessage = 'Request failed'
): Promise<T | null> {
  const response = await fetchJSON<T>(url, options);
  
  if (!response.ok) {
    // You can import and use toast here if needed
    console.error(errorMessage, response.error);
    return null;
  }
  
  return response.data ?? null;
}

