import { useMutation, useQuery } from "@tanstack/react-query";
import type { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

type AnyOptions = {
  query?: Record<string, unknown>;
  request?: RequestInit;
} | undefined;

type AnyRecord = Record<string, unknown>;

function query<T = unknown>(key: readonly unknown[], path: string, options?: AnyOptions) {
  const queryOptions = (options?.query ?? {}) as AnyRecord;
  return useQuery({
    queryKey: queryOptions.queryKey ?? key,
    queryFn: ({ signal }) => customFetch<T>(path, { signal, ...(options?.request ?? {}) }),
    ...queryOptions,
  } as UseQueryOptions<T>);
}

function mutation<TVariables = unknown, TData = unknown>(
  path: string,
  method = "POST",
  options?: UseMutationOptions<TData, Error, TVariables>,
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) =>
      customFetch<TData>(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: variables === undefined ? undefined : JSON.stringify(variables),
      }),
    ...options,
  });
}

export const getListPropertiesQueryKey = () => ["/api/properties"] as const;
export const useListProperties = (options?: AnyOptions) =>
  query(getListPropertiesQueryKey(), "/api/properties", options);

export const getGetMyPropertiesQueryKey = () => ["/api/properties/mine"] as const;
export const useGetMyProperties = (options?: AnyOptions) =>
  query(getGetMyPropertiesQueryKey(), "/api/properties/mine", options);

export const useDeleteProperty = () => mutation<{ id: number }>("/api/properties", "DELETE");
export const useUpdateProperty = () => mutation<{ id: number; [key: string]: unknown }>("/api/properties", "PATCH");

export const getGetAgentDashboardQueryKey = () => ["/api/agent/dashboard"] as const;
export const useGetAgentDashboard = (options?: AnyOptions) =>
  query(getGetAgentDashboardQueryKey(), "/api/agent/dashboard", options);
export const getGetAgentProfileQueryKey = () => ["/api/agent/profile"] as const;
export const useUpdateAgentProfile = () => mutation<AnyRecord>("/api/agent/profile", "PATCH");

export const useListProjects = (options?: AnyOptions) =>
  query(["/api/projects"], "/api/projects", options);
export const getListProjectUpdatesQueryKey = (projectId: number) =>
  ["/api/projects", projectId, "updates"] as const;
export const useListProjectUpdates = (projectId: number, options?: AnyOptions) =>
  query(getListProjectUpdatesQueryKey(projectId), `/api/projects/${projectId}/updates`, options);
export const getListMyBookingsQueryKey = () => ["/api/projects/bookings/mine"] as const;
export const useCreateBooking = () => mutation<AnyRecord>("/api/projects/bookings");

export const getGetPortfolioDashboardQueryKey = () => ["/api/portfolio/dashboard"] as const;
export const useGetPortfolioDashboard = (options?: AnyOptions) =>
  query(getGetPortfolioDashboardQueryKey(), "/api/portfolio/dashboard", options);

export const getListNotificationsQueryKey = () => ["/api/notifications"] as const;
export const useListNotifications = (options?: AnyOptions) =>
  query(getListNotificationsQueryKey(), "/api/notifications", options);
export const useMarkNotificationRead = () => mutation<{ id: number }>("/api/notifications/read", "POST");
export const useMarkAllNotificationsRead = () => mutation<void>("/api/notifications/read-all", "POST");
export const useClearAllNotifications = () => mutation<void>("/api/notifications", "DELETE");

export const getGetNotificationSettingsQueryKey = () => ["/api/notification-settings"] as const;
export const useGetNotificationSettings = (options?: AnyOptions) =>
  query(getGetNotificationSettingsQueryKey(), "/api/notification-settings", options);
export const useUpdateNotificationSettings = () =>
  mutation<AnyRecord>("/api/notification-settings", "PATCH");
export const useSubscribePush = () => mutation<AnyRecord>("/api/notification-settings/push");

export const getGetSubscriptionMeQueryKey = () => ["/api/subscription/me"] as const;
export const useGetSubscriptionMe = (options?: AnyOptions) =>
  query(getGetSubscriptionMeQueryKey(), "/api/subscription/me", options);
export const useSubscribeSubscription = () => mutation<AnyRecord>("/api/subscription");

export const useListInvestmentProjects = (options?: AnyOptions) =>
  query(["/api/investment-projects"], "/api/investment-projects", options);
export const useBuyShares = () => mutation<AnyRecord>("/api/investments/buy");