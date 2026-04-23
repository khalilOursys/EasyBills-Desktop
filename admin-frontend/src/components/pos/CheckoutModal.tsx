'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CreditCard, DollarSign, Smartphone, X } from 'lucide-react';
import { CartItem } from '@/app/(admin)/pos/page';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    cartItems: CartItem[];
    totalAmount: number;
}

export default function CheckoutModal({
    isOpen,
    onClose,
    onComplete,
    cartItems,
    totalAmount,
}: CheckoutModalProps) {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [cashAmount, setCashAmount] = useState<number>(totalAmount);
    const [isProcessing, setIsProcessing] = useState(false);

    const tax = totalAmount * 0.1;
    const grandTotal = totalAmount + tax;
    const change = cashAmount - grandTotal;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        setTimeout(() => {
            setIsProcessing(false);
            onComplete();
            console.log('Order completed:', { cartItems, totalAmount: grandTotal, paymentMethod });
        }, 1500);
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset- bg-black/50 backdrop-blur-sm" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                        <Dialog.Title className="text-xl font-semibold text-gray-800">
                            Checkout
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4">
                        {/* Order Summary */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-800 mb-3">Order Summary</h3>
                            <div className="space-y-2 mb-3">
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
                                disabled={isProcessing || (paymentMethod === 'cash' && cashAmount < grandTotal)}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Processing...' : 'Complete Order'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}