import React, {useState, useEffect} from "react";
import {
    useGetPaymentsQuery,
    useGetPaymentsByDateQuery,
    useGetPaymentsByStatusQuery,
    useUpdatePaymentMutation,
    useDeletePaymentMutation,
} from "../../features/components/paymentApi.js";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import {X, Calendar, Filter} from "lucide-react";

const PaymentManagement = ({refetchFlag, resetFlag}) => {
    // State
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [editingPaymentId, setEditingPaymentId] = useState(null);
    const [editingStatus, setEditingStatus] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        action: null,
    });

    // API hooks
    const {
        data: allPayments = [],
        isLoading: loadingAll,
        refetch: refetchAll
    } = useGetPaymentsQuery(undefined, {
        skip: filterStatus !== "" || filterDate !== ""
    });

    const {
        data: paymentsByDate = [],
        isLoading: loadingByDate,
        refetch: refetchByDate
    } = useGetPaymentsByDateQuery(filterDate, {
        skip: !filterDate
    });

    const {
        data: paymentsByStatus = [],
        isLoading: loadingByStatus,
        refetch: refetchByStatus
    } = useGetPaymentsByStatusQuery(filterStatus, {
        skip: !filterStatus
    });

    // Mutations
    const [updatePayment] = useUpdatePaymentMutation();
    const [deletePayment] = useDeletePaymentMutation();

    // Combine filters - apply both date and status filters
    const getFilteredPayments = () => {
        if (filterDate && filterStatus) {
            return paymentsByDate.filter(p => p.paymentStatus === filterStatus);
        } else if (filterDate) {
            return paymentsByDate;
        } else if (filterStatus) {
            return paymentsByStatus;
        } else {
            return allPayments;
        }
    };

    const isLoading = () => {
        if (filterDate && filterStatus) {
            return loadingByDate || loadingByStatus;
        } else if (filterDate) {
            return loadingByDate;
        } else if (filterStatus) {
            return loadingByStatus;
        }
        return loadingAll;
    };

    const basePayments = getFilteredPayments();
    const loading = isLoading();

    // Refetch when refetchFlag changes
    useEffect(() => {
        if (refetchFlag) {
            handleRefetch();
            if (resetFlag) resetFlag();
        }
    }, [refetchFlag]);

    const handleRefetch = async () => {
        try {
            if (filterDate) {
                await refetchByDate();
            }
            if (filterStatus) {
                await refetchByStatus();
            }
            if (!filterDate && !filterStatus) {
                await refetchAll();
            }
        } catch (error) {
            console.error("Error refetching:", error);
        }
    };

    // Filter payments locally by search term
    const filteredPayments = basePayments.filter(payment => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        const username = payment.user?.username?.toLowerCase() || "";
        const email = payment.user?.email?.toLowerCase() || "";

        return username.includes(searchLower) || email.includes(searchLower);
    });

    // Handle status update
    const handleUpdateStatus = async (paymentId) => {
        setIsSubmitting(true);
        try {
            const response = await updatePayment({
                id: paymentId,
                paymentStatus: editingStatus
            }).unwrap();

            showNotification("success", response.message || `Payment status updated to ${editingStatus}`);
            await handleRefetch();
            setEditingPaymentId(null);
            setEditingStatus("");

            if (selectedPayment?.id === paymentId) {
                setSelectedPayment(null);
            }
        } catch (error) {
            console.error("Error updating payment status:", error);
            showNotification("error", error.data?.message || "Failed to update payment status");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle edit - sets the payment in editing mode
    const handleEditClick = (payment) => {
        setEditingPaymentId(payment.id);
        setEditingStatus(payment.paymentStatus);
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingPaymentId(null);
        setEditingStatus("");
    };

    // Handle delete
    const handleDeletePayment = (payment) => {
        showNotification("error", `Are you sure you want to delete payment #${payment.id}?`, {
            callback: async () => {
                try {
                    const response = await deletePayment(payment.id).unwrap();
                    await handleRefetch();
                    if (selectedPayment?.id === payment.id) {
                        setSelectedPayment(null);
                    }
                    return response;
                } catch (error) {
                    console.error("Error deleting payment:", error);
                    throw error;
                }
            },
            successMessage: "Payment deleted successfully!",
            errorMessage: "Failed to delete payment.",
        });
    };

    // Clear all filters
    const handleClearFilters = () => {
        setFilterStatus("");
        setFilterDate("");
        setSearchTerm("");
    };

    // Handle date filter change
    const handleDateChange = (e) => {
        setFilterDate(e.target.value);
    };

    // Handle status filter change
    const handleStatusChange = (e) => {
        setFilterStatus(e.target.value);
    };

    // Show notification
    const showNotification = (type, message, action = null) => {
        setNotification({show: true, type, message, action});
    };

    const handleConfirmAction = async () => {
        if (notification.action) {
            const {callback} = notification.action;
            setIsSubmitting(true);
            try {
                const result = await callback();
                const successMessage = result?.message || notification.action.successMessage || "Action completed!";
                showNotification("success", successMessage);
            } catch (error) {
                const errorMessage = error.data?.message || notification.action.errorMessage || "Error performing action.";
                showNotification("error", errorMessage);
            } finally {
                setIsSubmitting(false);
                setNotification((prev) => ({...prev, action: null}));
            }
        }
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        switch (status) {
            case "PAID":
                return "bg-green-100 text-green-800 border-green-200";
            case "PENDING":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "CANCELLED":
                return "bg-red-100 text-red-800 border-red-200";
            case "REFUNDED":
                return "bg-purple-100 text-purple-800 border-purple-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString();
    };

    // Format currency
    const formatCurrency = (amount, currency = "LKR") => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Render loading state
    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading payments...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 space-y-6">
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({show: false, type: "", message: "", action: null})}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({show: false, type: "", message: "", action: null})}
                errorMessage={notification.message}
                errorAction={notification.action}
                onErrorAction={handleConfirmAction}
                isActionLoading={isSubmitting}
            />

            {/* Filters Section */}
            <div className="bg-white rounded-lg border p-4 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by username or email..."
                        className="w-full px-4 py-2 border rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5"/>
                        </button>
                    )}
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date Filter */}
                    <div className="relative">
                        <input
                            type="date"
                            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm"
                            value={filterDate}
                            onChange={handleDateChange}
                            placeholder="Filter by date"
                        />
                        <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400"/>
                    </div>

                    {/* Status Filter */}
                    <select
                        className="px-3 py-2 border rounded-lg text-sm"
                        value={filterStatus}
                        onChange={handleStatusChange}
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="REFUNDED">REFUNDED</option>
                    </select>

                    {/* Clear Filters */}
                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                        disabled={!filterDate && !filterStatus && !searchTerm}
                    >
                        <Filter className="w-4 h-4"/>
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Payments Table - Custom implementation without DataTable */}
            <div className="bg-white rounded-lg border overflow-hidden">
                {filteredPayments.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">No payments found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPayments.map((payment) => {
                                const isSelected = selectedPayment?.id === payment.id;
                                const isEditing = editingPaymentId === payment.id;

                                return (
                                    <tr
                                        key={payment.id}
                                        className={`hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""}`}
                                    >
                                        {/* ID */}
                                        <td className="px-6 py-4 whitespace-normal break-words">
                                            <div className="text-sm font-medium text-gray-900">#{payment.id}</div>
                                        </td>

                                        {/* User */}
                                        <td className="px-6 py-4 whitespace-normal break-words">
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {payment.user?.username || "N/A"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {payment.user?.email || "No email"}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Amount */}
                                        <td className="px-6 py-4 whitespace-normal break-words">
                                            <div className="space-y-1">
                                                <div className="text-sm font-bold text-blue-600">
                                                    {formatCurrency(payment.amount, payment.currency)}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Paid Date */}
                                        <td className="px-6 py-4 whitespace-normal break-words">
                                            <div className="text-xs">
                                                {formatDate(payment.paidAt)}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 whitespace-normal break-words">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={editingStatus}
                                                        onChange={(e) => setEditingStatus(e.target.value)}
                                                        className="text-xs border rounded px-2 py-1 bg-white"
                                                        disabled={isSubmitting}
                                                        autoFocus
                                                    >
                                                        <option value="PENDING">PENDING</option>
                                                        <option value="PAID">PAID</option>
                                                        <option value="CANCELLED">CANCELLED</option>
                                                        <option value="REFUNDED">REFUNDED</option>
                                                    </select>
                                                </div>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(payment.paymentStatus)}`}>
                                                        {payment.paymentStatus}
                                                    </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-normal break-words">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(payment.id)}
                                                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                                        disabled={isSubmitting}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                                        disabled={isSubmitting}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(payment)}
                                                        className="px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 whitespace-nowrap"
                                                        disabled={isSubmitting}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePayment(payment)}
                                                        className="px-3 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 whitespace-nowrap"
                                                        disabled={true}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentManagement;