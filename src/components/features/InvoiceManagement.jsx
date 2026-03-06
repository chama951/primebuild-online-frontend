import {useEffect, useState, useMemo} from "react";
import DataTable from "../common/DataTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import Unauthorized from "../common/Unauthorized.jsx";
import InvoiceDetails from "./invoice/InvoiceDetails.jsx";

import {
    useGetInvoicesByUserTypeQuery,
    useUpdateInvoiceMutation,
    useDeleteInvoiceMutation
} from "../../services/invoiceApi.js";

const InvoiceManagement = ({refetchFlag, resetFlag}) => {
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filterUserType, setFilterUserType] = useState("all"); // "all" or "customer"
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

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
    } = useGetInvoicesByUserTypeQuery(
        filterUserType === "all" ? "" : filterUserType
    );

    const [updateInvoice] = useUpdateInvoiceMutation();
    const [deleteInvoice] = useDeleteInvoiceMutation();

    const isUnauthorized = error?.status === 401 || error?.status === 403;
    if (isUnauthorized) return <Unauthorized/>;

    useEffect(() => {
        if (refetchFlag) {
            refetch();
            resetFlag();
        }
    }, [refetchFlag, resetFlag, refetch]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterDate, filterUserType]);

    if (error?.status === 401 || error?.status === 403)
        return <Unauthorized/>;

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

    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const showNotification = (type, message, action = null) => {
        setNotification({show: true, type, message, action});
    };

    const handleConfirmAction = async () => {
        if (!notification.action) return;

        const {callback} = notification.action;
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
            setNotification(prev => ({...prev, action: null}));
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
            setSelectedInvoice(null);
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
                <div>
                    <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
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
            header: "Total",
            render: inv => (
                <div className="text-sm font-semibold">
                    Rs {formatCurrency(inv.totalAmount)}
                </div>
            )
        },
        {
            key: "createdAt",
            header: "Created At",
            render: inv => (
                <div className="text-xs">
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

                <select
                    className="h-10 w-48 p-2 border rounded"
                    value={filterUserType}
                    onChange={(e) => setFilterUserType(e.target.value)}
                >
                    <option value="all">All Users</option>
                    <option value="customer">Customer</option>
                </select>
            </div>

            <DataTable
                items={paginatedInvoices}
                selectedItem={selectedInvoice}
                onSelectItem={setSelectedInvoice}
                onDeleteItemClick={handleDelete}
                columns={columns}
                emptyMessage={isLoading ? "Loading..." : "No invoices found"}
            />

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Prev
                    </button>

                    {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 border rounded ${currentPage === page ? "bg-blue-600 text-white" : ""}`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

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