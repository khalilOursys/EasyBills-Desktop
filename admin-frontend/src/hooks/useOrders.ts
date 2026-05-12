import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    createOrder, 
    getOrders, 
    getOrderById, 
    CreateOrderDto, 
    OrderResponse
} from '@/lib/api/orders';

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (orderData: CreateOrderDto) => createOrder(orderData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error: Error) => {
            console.error('Failed to create order:', error);
        },
    });
};

export const useUpdateOrder = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateOrderDto> }) => 
            updateOrder(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
        },
        onError: (error: Error) => {
            console.error('Failed to update order:', error);
        },
    });
};

export const useOrders = (page?: number, limit?: number) => {
    return useQuery({
        queryKey: ['orders', page, limit],
        queryFn: () => getOrders(page, limit),
        staleTime: 1 * 60 * 1000,
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

async function updateOrder(id: number, orderData: Partial<CreateOrderDto>): Promise<OrderResponse> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}orders/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update order');
    }
    
    return response.json();
}