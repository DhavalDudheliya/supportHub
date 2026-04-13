import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { customerService } from "@/lib/services/customer.service";

export function useCustomers() {
  // To avoid changing component logic, we fetch all pages here sequentially
  // if the limit indicates more pages. Alternatively, infiniteQuery could be used,
  // but to keep it simple and preserve existing frontend structure:
  return useQuery({
    queryKey: queryKeys.customers.lists(), // specific key for "all" fetch
    queryFn: async () => {
      const FETCH_LIMIT = 100;
      const firstPage = await customerService.list(1, FETCH_LIMIT);
      const totalPages = Math.max(1, Math.ceil(firstPage.total / FETCH_LIMIT));

      if (totalPages === 1) {
        return {
          customers: firstPage.customers,
          total: firstPage.total,
        };
      }

      const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) =>
          customerService.list(index + 2, FETCH_LIMIT),
        ),
      );

      return {
        customers: [
          ...firstPage.customers,
          ...remainingPages.flatMap((response) => response.customers),
        ],
        total: firstPage.total,
      };
    },
  });
}

export function useCustomersList(
  page: number = 1,
  limit: number = 25,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: queryKeys.customers.list(page, limit),
    queryFn: () => customerService.list(page, limit),
    enabled,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof customerService.update>[1];
    }) => customerService.update(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
}
