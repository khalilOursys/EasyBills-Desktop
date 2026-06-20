// src/app/payments/add/page.tsx
"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { PaymentForm } from "@/components/payments/PaymentForm";

const addPayment = async (paymentData: any) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create payment");
  }
  return response.json();
};

export default function AddPaymentPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Get query parameters from URL
  const supplierId = searchParams.get("supplierId") || undefined;
  const clientId = searchParams.get("clientId") || undefined;
  const invoiceType = (searchParams.get("type") as "purchase" | "sale") || undefined;

  const mutation = useMutation({
    mutationFn: addPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  return (
    <div>
      <PageBreadcrumb pageTitle="Ajouter un paiement" />
      <PaymentForm
        isEditing={false}
        supplierId={supplierId}
        clientId={clientId}
        invoiceType={invoiceType}
        onSubmit={mutation.mutateAsync}
        isLoading={mutation.isPending}
      />
    </div>
  );
}