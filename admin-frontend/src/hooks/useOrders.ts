// hooks/useOrders.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrder, getOrders, getOrderById, CreateOrderDto } from '@/lib/api/orders';

// Make sure this matches your backend Order schema
export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (orderData: CreateOrderDto) => createOrder(orderData),
        onSuccess: () => {
            // Invalidate orders list query to refetch
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error: Error) => {
            console.error('Failed to create order:', error);
        },
    });
};

export const useOrders = (page?: number, limit?: number) => {
    return useQuery({
        queryKey: ['orders', page, limit],
        queryFn: () => getOrders(page, limit),
        staleTime: 1 * 60 * 1000, // 1 minute
    });
};

export const useOrder = (id: number) => {
    return useQuery({
        queryKey: ['order', id],
        queryFn: () => getOrderById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};