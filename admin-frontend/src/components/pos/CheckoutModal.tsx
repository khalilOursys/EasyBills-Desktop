// components/pos/CheckoutModal.tsx
'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CreditCard, DollarSign, Smartphone, X, Edit2 } from 'lucide-react';
import { CartItem } from '@/app/(admin)/pos/page';
import { useCreateOrder, useUpdateOrder } from '@/hooks/useOrders';
import { useToast } from '@/components/providers/ToastProvider';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (paymentMethod: 'CASH' | 'CREDIT_CARD' | 'MOBILE_PAYMENT', paymentAmount: number) => void;
    cartItems: CartItem[];
    totalAmount: number;
    isUpdateMode?: boolean;
    editingOrderId?: number | null;
}

export default function CheckoutModal({
    isOpen,
    onClose,
    onComplete,
    cartItems,
    totalAmount,
    isUpdateMode = false,
    editingOrderId = null,
}: CheckoutModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
    const [cashAmount, setCashAmount] = useState<number>(totalAmount);
    const [tableNumber, setTableNumber] = useState('');
    const [notes, setNotes] = useState('');

    const createOrderMutation = useCreateOrder();
    const updateOrderMutation = useUpdateOrder();
    const { showToast } = useToast();

    const tax = totalAmount * 0.1; // 10% tax
    const grandTotal = totalAmount + tax;
    const change = cashAmount - grandTotal;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const selectedPaymentMethod = paymentMethod.toUpperCase() as 'CASH' | 'CREDIT_CARD' | 'MOBILE_PAYMENT';
        const finalPaymentAmount = paymentMethod === 'cash' ? cashAmount : grandTotal;

        try {
            if (isUpdateMode && editingOrderId) {
                // Prepare order data for update
                const orderItems = cartItems.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price,
                }));

                const orderData = {
                    items: orderItems,
                    subtotal: totalAmount,
                    tax: tax,
                    total: grandTotal,
                    payment: {
                        amount: finalPaymentAmount,
                        method: selectedPaymentMethod,
                        change: paymentMethod === 'cash' && cashAmount >= grandTotal ? change : 0,
                    },
                    tableNumber: tableNumber || undefined,
                    notes: notes || undefined,
                };

                await updateOrderMutation.mutateAsync({
                    id: editingOrderId,
                    data: orderData,
                });
                showToast('Order updated successfully!', 'success');
                onComplete(selectedPaymentMethod, finalPaymentAmount);
            } else {
                // Let the parent component handle order creation
                onComplete(selectedPaymentMethod, finalPaymentAmount);
            }
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to process order', 'error');
        }
    };

    const isLoading = createOrderMutation.isPending || updateOrderMutation.isPending;

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {isUpdateMode && <Edit2 className="w-5 h-5 text-blue-600" />}
                            <Dialog.Title className="text-xl font-semibold text-gray-800">
                                {isUpdateMode ? 'Update Order' : 'Checkout'}
                            </Dialog.Title>
                        </div>
                        <Dialog.Close asChild>
                            <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    {isUpdateMode && editingOrderId && (
                        <div className="bg-blue-50 p-3 border-b border-blue-200">
                            <p className="text-sm text-blue-700 flex items-center gap-2">
                                <Edit2 className="w-4 h-4" />
                                Updating Order #{editingOrderId}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-4">
                        {/* Order Summary */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-800 mb-3">Order Summary</h3>
                            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>{item.name} x{item.quantity}</span>
                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-200 pt-2 space-y-1">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal:</span>
                                    <span>${totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Tax (10%):</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-800 pt-2">
                                    <span>Total:</span>
                                    <span>${grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Table Number (Optional) */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Table Number (Optional)
                            </label>
                            <input
                                type="text"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                placeholder="e.g., 5, 12, Bar"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Payment Method */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-800 mb-3">Payment Method</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`p-3 rounded-lg border-2 transition-all ${paymentMethod === 'cash'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <DollarSign className="w-6 h-6 mx-auto mb-1" />
                                    <div className="text-sm">Cash</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-3 rounded-lg border-2 transition-all ${paymentMethod === 'card'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <CreditCard className="w-6 h-6 mx-auto mb-1" />
                                    <div className="text-sm">Card</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('mobile')}
                                    className={`p-3 rounded-lg border-2 transition-all ${paymentMethod === 'mobile'
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Smartphone className="w-6 h-6 mx-auto mb-1" />
                                    <div className="text-sm">Mobile</div>
                                </button>
                            </div>
                        </div>

                        {/* Cash Payment Details */}
                        {paymentMethod === 'cash' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cash Amount
                                </label>
                                <input
                                    type="number"
                                    value={cashAmount}
                                    onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min={grandTotal}
                                    step={0.01}
                                />
                                {cashAmount >= grandTotal && (
                                    <div className="mt-2 text-sm text-green-600">
                                        Change: ${change.toFixed(2)}
                                    </div>
                                )}
                                {cashAmount < grandTotal && cashAmount > 0 && (
                                    <div className="mt-2 text-sm text-red-600">
                                        Insufficient amount
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes (Optional) */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Special Instructions (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g., No sugar, extra napkins, etc."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={isLoading || (paymentMethod === 'cash' && cashAmount < grandTotal)}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading
                                    ? 'Processing...'
                                    : isUpdateMode
                                        ? 'Update Order'
                                        : 'Complete Order'
                                }
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}