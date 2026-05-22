// components/inventory/InventoryMovementsTable.tsx
"use client";

import { useState } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Toast from "@radix-ui/react-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { Pencil, Trash2, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";

type StockMovement = {
    id: number;
    movementNumber: string;
    type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "RETURN" | "LOSS";
    quantity: number;
    previousStock: number;
    newStock: number;
    reason: string;
    notes?: string;
    status: "PENDING" | "COMPLETED" | "CANCELLED";
    createdAt: string;
    product: {
        id: number;
        name: string;
        reference: string;
    };
};

const fetchMovements = async (params?: {
    page?: number;
    limit?: number;
}): Promise<{ movements: StockMovement[]; total: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const url = `${process.env.NEXT_PUBLIC_API_URL}inventory/movements${queryParams.toString() ? `?${queryParams}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch movements");
    return res.json();
};

const updateMovementStatus = async (id: number, status: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}inventory/movements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update movement");
    return res.json();
};

const cancelMovement = async (id: number, reason?: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}inventory/movements/${id}${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`;
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to cancel movement");
    return res.json();
};

export default function InventoryMovementsTable() {
    const queryClient = useQueryClient();
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMsg, setToastMsg] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
    const [theme] = useState<"light" | "dark">("light");

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setToastOpen(true);
    };

    const {
        data,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["inventory-movements", pagination],
        queryFn: () => fetchMovements({
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
        }),
    });

    const handleView = (movement: StockMovement) => {
        setSelectedMovement(movement);
        setViewDialogOpen(true);
    };

    const handleCancel = (movement: StockMovement) => {
        setSelectedMovement(movement);
        setDialogOpen(true);
    };

    const confirmCancel = async () => {
        if (!selectedMovement) return;

        try {
            await cancelMovement(selectedMovement.id, "Cancelled by user");
            await refetch();
            queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
            showToast(`✅ Movement ${selectedMovement.movementNumber} cancelled`);
        } catch (err) {
            showToast("❌ Failed to cancel movement");
        } finally {
            setDialogOpen(false);
            setSelectedMovement(null);
        }
    };

    const columns: MRT_ColumnDef<StockMovement>[] = [
        {
            accessorKey: "movementNumber",
            header: "Movement #",
            size: 150,
        },
        {
            accessorKey: "type",
            header: "Type",
            size: 120,
            Cell: ({ cell }) => {
                const type = cell.getValue() as string;
                const colors: Record<string, string> = {
                    INBOUND: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
                    OUTBOUND: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
                    ADJUSTMENT: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
                    RETURN: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
                    LOSS: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs ${colors[type] || "bg-gray-100"}`}>
                        {type}
                    </span>
                );
            },
        },
        {
            accessorKey: "product.name",
            header: "Product",
            size: 200,
        },
        {
            accessorKey: "quantity",
            header: "Quantity",
            size: 100,
            Cell: ({ cell, row }) => {
                const quantity = cell.getValue() as number;
                const type = row.original.type;
                return (
                    <span className={type === "OUTBOUND" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                        {quantity > 0 ? `+${quantity}` : quantity}
                    </span>
                );
            },
        },
        {
            accessorKey: "previousStock",
            header: "Old Stock",
            size: 100,
        },
        {
            accessorKey: "newStock",
            header: "New Stock",
            size: 100,
        },
        {
            accessorKey: "status",
            header: "Status",
            size: 120,
            Cell: ({ cell }) => {
                const status = cell.getValue() as string;
                const colors: Record<string, string> = {
                    COMPLETED: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
                    PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
                    CANCELLED: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || "bg-gray-100"}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            accessorKey: "reason",
            header: "Reason",
            size: 250,
        },
        {
            accessorKey: "createdAt",
            header: "Date",
            size: 180,
            Cell: ({ cell }) => format(new Date(cell.getValue() as string), "dd/MM/yyyy HH:mm"),
        },
        {
            id: "actions",
            header: "Actions",
            size: 120,
            Cell: ({ row }) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleView(row.original)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-5 h-5" />
                    </button>
                    {row.original.status !== "CANCELLED" && (
                        <button
                            onClick={() => handleCancel(row.original)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                            title="Cancel Movement"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <Toast.Provider swipeDirection="right">
            <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Stock Movements
                    </h1>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                <div className="dark:bg-gray-800 dark:text-white rounded-lg overflow-hidden">
                    <MaterialReactTable
                        columns={columns}
                        data={data?.movements || []}
                        enableColumnActions={true}
                        enableColumnFilters={true}
                        enablePagination={true}
                        enableSorting={true}
                        enableBottomToolbar={true}
                        enableTopToolbar={true}
                        muiTableBodyRowProps={{ hover: false }}
                        state={{
                            isLoading,
                            pagination,
                        }}
                        onPaginationChange={setPagination}
                        rowCount={data?.total || 0}
                        manualPagination={true}
                        muiTablePaperProps={{
                            sx: {
                                backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                                color: theme === "dark" ? "#f3f4f6" : "#111827",
                            },
                        }}
                        muiTableHeadCellProps={{
                            sx: {
                                backgroundColor: theme === "dark" ? "#374151" : "#f9fafb",
                                color: theme === "dark" ? "#f3f4f6" : "#374151",
                                fontWeight: "bold",
                            },
                        }}
                        muiTableBodyCellProps={{
                            sx: {
                                borderBottomColor: theme === "dark" ? "#374151" : "#e5e7eb",
                                color: theme === "dark" ? "#f3f4f6" : "#111827",
                            },
                        }}
                        muiTopToolbarProps={{
                            sx: {
                                backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                                color: theme === "dark" ? "#f3f4f6" : "#111827",
                            },
                        }}
                        muiBottomToolbarProps={{
                            sx: {
                                backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                                color: theme === "dark" ? "#f3f4f6" : "#111827",
                            },
                        }}
                        muiPaginationProps={{
                            sx: {
                                color: theme === "dark" ? "#f3f4f6" : "#111827",
                                "& .MuiTablePagination-selectIcon": {
                                    color: theme === "dark" ? "#f3f4f6" : "#111827",
                                },
                                "& .MuiTablePagination-actions button": {
                                    color: theme === "dark" ? "#f3f4f6" : "#111827",
                                },
                            },
                        }}
                    />
                </div>

                {isError && (
                    <Toast.Root
                        open
                        className="bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded-md shadow-lg"
                    >
                        <Toast.Title>❌ Failed to fetch movements</Toast.Title>
                    </Toast.Root>
                )}

                <Toast.Root
                    open={toastOpen}
                    onOpenChange={setToastOpen}
                    className="bg-gray-900 dark:bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg"
                >
                    <Toast.Title className="font-bold">{toastMsg}</Toast.Title>
                </Toast.Root>
                <Toast.Viewport className="fixed top-4 right-4 w-96 max-w-full outline-none z-50" />

                {/* View Details Dialog */}
                <Dialog.Root open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                    <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
                        <Dialog.Content className="fixed top-1/2 left-1/2 w-[600px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg z-50 transition-colors duration-200">
                            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                                Movement Details
                            </Dialog.Title>

                            {selectedMovement && (
                                <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Movement #
                                            </label>
                                            <p className="font-mono text-gray-900 dark:text-white">
                                                {selectedMovement.movementNumber}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Status
                                            </label>
                                            <div>
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs ${selectedMovement.status === "COMPLETED"
                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                                        : selectedMovement.status === "PENDING"
                                                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                                    }`}>
                                                    {selectedMovement.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Product
                                            </label>
                                            <p className="text-gray-900 dark:text-white">
                                                {selectedMovement.product?.name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Ref: {selectedMovement.product?.reference}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Type
                                            </label>
                                            <p className="text-gray-900 dark:text-white">
                                                {selectedMovement.type}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Quantity
                                            </label>
                                            <p className={`font-semibold ${selectedMovement.type === "OUTBOUND"
                                                    ? "text-red-600 dark:text-red-400"
                                                    : "text-green-600 dark:text-green-400"
                                                }`}>
                                                {selectedMovement.quantity > 0 ? `+${selectedMovement.quantity}` : selectedMovement.quantity}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Stock Change
                                            </label>
                                            <p className="text-gray-900 dark:text-white">
                                                {selectedMovement.previousStock} → {selectedMovement.newStock}
                                                <span className={`text-sm ml-2 ${selectedMovement.newStock - selectedMovement.previousStock > 0
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                    }`}>
                                                    ({selectedMovement.newStock - selectedMovement.previousStock > 0 ? "+" : ""}
                                                    {selectedMovement.newStock - selectedMovement.previousStock})
                                                </span>
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Reason
                                            </label>
                                            <p className="text-gray-900 dark:text-white">
                                                {selectedMovement.reason}
                                            </p>
                                        </div>
                                        {selectedMovement.notes && (
                                            <div className="col-span-2">
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Notes
                                                </label>
                                                <p className="text-gray-900 dark:text-white">
                                                    {selectedMovement.notes}
                                                </p>
                                            </div>
                                        )}
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Created At
                                            </label>
                                            <p className="text-gray-900 dark:text-white">
                                                {format(new Date(selectedMovement.createdAt), "dd/MM/yyyy HH:mm:ss")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setViewDialogOpen(false)}
                                    className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>

                {/* Cancel Confirmation Dialog */}
                <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
                    <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
                        <Dialog.Content className="fixed top-1/2 left-1/2 w-96 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg z-50 transition-colors duration-200">
                            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                                Confirm Cancel
                            </Dialog.Title>
                            <Dialog.Description className="mt-2 text-gray-600 dark:text-gray-300">
                                Are you sure you want to cancel movement{" "}
                                <span className="font-semibold">
                                    {selectedMovement?.movementNumber ?? ""}
                                </span>
                                ?
                            </Dialog.Description>

                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    onClick={() => setDialogOpen(false)}
                                    className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCancel}
                                    className="px-4 py-2 rounded-md bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
                                >
                                    Yes, Cancel Movement
                                </button>
                            </div>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            </div>
        </Toast.Provider>
    );
}