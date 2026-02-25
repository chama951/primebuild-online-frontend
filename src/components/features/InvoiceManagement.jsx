import { useEffect, useState, useMemo } from "react";
import DataTable from "../common/DataTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import Unauthorized from "../common/Unauthorized.jsx";
import InvoiceDetails from "./InvoiceDetails.jsx";

import {
    useGetInvoicesQuery,
    useUpdateInvoiceMutation,
    useDeleteInvoiceMutation
} from "../../features/components/InvoiceApi.js";

const InvoiceManagement = ({ refetchFlag, resetFlag }) => {
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        action: null
    });

    const {
        data: invoices = [],
        error,
        refetch,
        isLoading
    } = useGetInvoicesQuery();

    const [updateInvoice] = useUpdateInvoiceMutation();
    const [deleteInvoice] = useDeleteInvoiceMutation();

    useEffect(() => {
        if (refetchFlag) {
            refetch();
            resetFlag();
        }
    }, [refetchFlag, resetFlag, refetch]);

    if (error?.status === 401 || error?.status === 403)
        return <Unauthorized />;

    const filteredInvoices = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();

        return invoices.filter(inv => {
            const statusMatch = filterStatus
                ? inv.invoiceStatus === filterStatus
                : true;

            const dateMatch = filterDate
                ? inv.createdAt?.split("T")[0] === filterDate
                : true;

            const userMatch =
                inv.user?.username?.toLowerCase().includes(term);

            const statusSearchMatch =
                inv.invoiceStatus?.toLowerCase().includes(term);

            return statusMatch && dateMatch && (userMatch || statusSearchMatch);
        });
    }, [invoices, searchTerm, filterStatus, filterDate]);

    const showNotification = (type, message, action = null) => {
        setNotification({ show: true, type, message, action });
    };

    const handleConfirmAction = async () => {
        if (!notification.action) return;

        const { callback } = notification.action;
        setIsSubmitting(true);

        try {
            const result = await callback();
            showNotification(
                "success",
                result?.message || notification.action.successMessage
            );
        } catch (err) {
            showNotification(
                "error",
                err?.data?.message || notification.action.errorMessage
            );
        } finally {
            setIsSubmitting(false);
            setNotification(prev => ({ ...prev, action: null }));
        }
    };

    const handleUpdate = async (status) => {
        if (!selectedInvoice) return;

        setIsSubmitting(true);

        try {
            const response = await updateInvoice({
                id: selectedInvoice.id,
                invoiceStatus: status,
                itemList: selectedInvoice.invoiceItems.map(item => ({
                    id: item.item.id,
                    quantity: item.invoiceQuantity.toString()
                }))
            }).unwrap();

            showNotification(
                "success",
                response.message || "Invoice updated successfully!"
            );

            refetch();
            setSelectedInvoice(null); // Close modal
        } catch (err) {
            showNotification(
                "error",
                err?.data?.message || "Failed to update invoice."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (invoice) => {
        showNotification(
            "error",
            `Are you sure you want to delete invoice #${invoice.id}?`,
            {
                callback: async () => {
                    const res = await deleteInvoice(invoice.id).unwrap();
                    refetch();
                    return res;
                },
                successMessage: "Invoice deleted successfully!",
                errorMessage: "Failed to delete invoice."
            }
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateStr) =>
        dateStr ? new Date(dateStr).toLocaleString() : "-";

    const columns = [
        {
            key: "id",
            header: "ID",
            render: inv => (
                <div className="text-sm text-gray-500">
                    #{inv.id}
                </div>
            )
        },
        {
            key: "user",
            header: "User",
            render: inv => (
                <div className="text-sm font-medium">
                    {inv.user?.username || "N/A"}
                </div>
            )
        },
        {
            key: "status",
            header: "Status",
            render: inv => (
                <div >
                    <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                            inv.invoiceStatus === "PAID"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                        {inv.invoiceStatus}
                    </span>
                </div>
            )
        },
        {
            key: "total",
            header: "Total (Rs)",
            render: inv => (
                <div className="text-sm font-bold">
                    Rs {formatCurrency(inv.totalAmount)}
                </div>
            )
        },
        {
            key: "createdAt",
            header: "Created At",
            render: inv => (
                <div className="text-xs text-center">
                    {formatDate(inv.createdAt)}
                </div>
            )
        }
    ];

    return (
        <div className="container mx-auto p-4 space-y-6">

            <div className="bg-white rounded-lg border p-4 flex gap-4 items-center">
                <input
                    type="text"
                    placeholder="Search user or status..."
                    className="flex-1 h-10 px-4 border rounded"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                    className="h-10 w-48 p-2 border rounded"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="PAID">PAID</option>
                    <option value="NOT_PAID">NOT_PAID</option>
                </select>

                <input
                    type="date"
                    className="h-10 w-48 p-2 border rounded"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                />
            </div>

            <DataTable
                items={filteredInvoices}
                selectedItem={selectedInvoice}
                onSelectItem={setSelectedInvoice}
                onDeleteItemClick={handleDelete}
                columns={columns}
                emptyMessage={isLoading ? "Loading..." : "No invoices found"}
            />

            {selectedInvoice && (
                <InvoiceDetails
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    onUpdate={handleUpdate}
                    isSubmitting={isSubmitting}
                />
            )}

            <NotificationDialogs
                showSuccessDialog={
                    notification.show && notification.type === "success"
                }
                setShowSuccessDialog={() =>
                    setNotification({
                        show: false,
                        type: "",
                        message: "",
                        action: null
                    })
                }
                successMessage={notification.message}
                showErrorDialog={
                    notification.show && notification.type === "error"
                }
                setShowErrorDialog={() =>
                    setNotification({
                        show: false,
                        type: "",
                        message: "",
                        action: null
                    })
                }
                errorMessage={notification.message}
                errorAction={notification.action}
                onErrorAction={handleConfirmAction}
                isActionLoading={isSubmitting}
            />
        </div>
    );
};

export default InvoiceManagement;