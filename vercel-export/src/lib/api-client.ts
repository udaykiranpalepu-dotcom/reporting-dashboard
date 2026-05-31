import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions, UseQueryResult, QueryKey } from "@tanstack/react-query";

export interface DashboardData {
  [key: string]: any;
}

export type GetDashboardDataParams = {
  date?: string;
};

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    signal,
    headers: { "Cache-Control": "no-cache" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const e = Object.assign(new Error(err.error || res.statusText), {
      status: res.status,
      data: err,
    });
    throw e;
  }
  return res.json();
}

export const getGetDashboardDataQueryKey = (params?: GetDashboardDataParams) =>
  ["/api/dashboard/data", ...(params ? [params] : [])] as const;

export function useGetDashboardData<TData = DashboardData, TError = unknown>(
  params?: GetDashboardDataParams,
  options?: { query?: UseQueryOptions<DashboardData, TError, TData> }
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryKey = options?.query?.queryKey ?? getGetDashboardDataQueryKey(params);

  const query = useQuery<DashboardData, TError, TData>({
    queryKey,
    queryFn: ({ signal }) => {
      const searchParams = new URLSearchParams();
      if (params?.date) searchParams.set("date", params.date);
      const qs = searchParams.toString();
      return fetchJson<DashboardData>(`/api/dashboard/data${qs ? `?${qs}` : ""}`, signal);
    },
    ...options?.query,
  });

  return { ...query, queryKey };
}
