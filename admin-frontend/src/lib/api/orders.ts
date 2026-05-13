// lib/api/orders.ts
export interface OrderItem {
    productId: number;
    quantity: number;
    price: number;
}

export interface OrderPayment {
    amount: number;
    method: 'CASH' | 'CREDIT_CARD' | 'MOBILE_PAYMENT';
    change?: number;
}

export interface CreateOrderDto {
    items: OrderItem[];
    subtotal: number;  // Total before tax
    tax: number;       // Tax amount
    total: number;     // Total after tax
    payment: OrderPayment;  // Payment object
    tableNumber?: string;
    notes?: string;
    cashierId?: number;
}

export interface OrderResponse {
    id: number;
    orderNumber: string;
    createdAt: string;
    subtotal: number;
    tax: number;
    total: number;
    tableNumber?: string;
    notes?: string;
    status: string;
    items: OrderItem[];
    orderPayments: OrderPayment[];
}

export async function createOrder(orderData: CreateOrderDto): Promise<OrderResponse> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
    }
    
    return response.json();
}

export async function getOrders(page?: number, limit?: number) {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}orders?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
}

export async function getOrderById(id: number) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}orders/${id}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
}

export async function getTodayStats() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}orders/today/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
}