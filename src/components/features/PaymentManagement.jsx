import React, { useState, useEffect, useMemo } from "react";
import { X, Calendar, Filter } from "lucide-react";
import {
    useGetPaymentsQuery,
    useGetPaymentsByDateQuery,
    useGetPaymentsByStatusQuery,
    useUpdatePaymentMutation,
    useDeletePaymentMutation,
} from "../../services/paymentApi.js";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import Unauthorized from "../common/Unauthorized.jsx";
import PaymentDetails from "./payment/PaymentDetails.jsx";

const PaymentManagement = ({ refetchFlag, resetFlag }) => {
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        action: null,
    });

    const {
        data: allPayments = [],
        isLoading: loadingAll,
        error: errorAll,
        refetch: refetchAll,
    } = useGetPaymentsQuery(undefined, { skip: filterStatus !== "" || filterDate !== "" });

    const {
        data: paymentsByDate = [],
        isLoading: loadingByDate,
        error: errorByDate,
        refetch: refetchByDate,
    } = useGetPaymentsByDateQuery(filterDate, { skip: !filterDate });

    const {
        data: paymentsByStatus = [],
        isLoading: loadingByStatus,
        error: errorByStatus,
        refetch: refetchByStatus,
    } = useGetPaymentsByStatusQuery(filterStatus, { skip: !filterStatus });

    const [updatePayment] = useUpdatePaymentMutation();
    const [deletePayment] = useDeletePaymentMutation();

    const getFilteredPayments = () => {
        if (filterDate && filterStatus) return paymentsByDate.filter((p) => p.paymentStatus === filterStatus);
        if (filterDate) return paymentsByDate;
        if (filterStatus) return paymentsByStatus;
        return allPayments;
    };

    const isLoading = () => {
        if (filterDate && filterStatus) return loadingByDate || loadingByStatus;
        if (filterDate) return loadingByDate;
        if (filterStatus) return loadingByStatus;
        return loadingAll;
    };

    const basePayments = getFilteredPayments();
    const loading = isLoading();

    useEffect(() => {
        if (refetchFlag) {
            handleRefetch();
            if (resetFlag) resetFlag();
        }
    }, [refetchFlag]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterDate]);

    const handleRefetch = async () => {
        try {
            if (filterDate) await refetchByDate();
            if (filterStatus) await refetchByStatus();
            if (!filterDate && !filterStatus) await refetchAll();
        } catch (error) {
            console.error("Error refetching:", error);
        }
    };

    const error = errorAll || errorByDate || errorByStatus;
    if (error?.status === 401 || error?.status === 403) return <Unauthorized />;

    const filteredPayments = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return basePayments.filter((payment) => {
            if (!term) return true;
            const username = payment.user?.username?.toLowerCase() || "";
            const email = payment.user?.email?.toLowerCase() || "";
            return username.includes(term) || email.includes(term);
        });
    }, [basePayments, searchTerm]);

    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const paginatedPayments = filteredPayments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleClearFilters = () => {
        setFilterStatus("");
        setFilterDate("");
        setSearchTerm("");
    };

    const showNotification = (type, message, action = null) => {
        setNotification({ show: true, type, message, action });
    };

    const formatDate = (dateString) => (!dateString ? "N/A" : new Date(dateString).toLocaleString());
    const formatCurrency = (amount, currency = "LKR") =>
        new Intl.NumberFormat("en-LK", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);

    const getStatusBadge = (status) => {
        switch (status) {
            case "PAID": return "bg-green-100 text-green-800 border-green-200";
            case "PENDING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
            case "REFUNDED": return "bg-purple-100 text-purple-800 border-purple-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                errorMessage={notification.message}
            />

            {selectedPaymentId && (
                <PaymentDetails
                    paymentId={selectedPaymentId}
                    onClose={() => setSelectedPaymentId(null)}
                    refetchPayments={handleRefetch}
                />
            )}

            <div className="bg-white rounded-lg border p-4 space-y-4">
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
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <input
                            type="date"
                            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                        <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                    </div>

                    <select
                        className="px-3 py-2 border rounded-lg text-sm"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="REFUNDED">REFUNDED</option>
                    </select>

                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                        disabled={!filterDate && !filterStatus && !searchTerm}
                    >
                        <Filter className="w-4 h-4" /> Clear Filters
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading payments...</span>
                    </div>
                ) : paginatedPayments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No payments found</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedPayments.map((payment) => (
                                    <tr
                                        key={payment.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => setSelectedPaymentId(payment.id)}
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-500">#{payment.id}</td>
                                        <td className="px-6 py-4 text-sm">{payment.user?.username || "N/A"}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-blue-600">{formatCurrency(payment.amount, payment.currency)}</td>
                                        <td className="px-6 py-4 text-xs">{formatDate(payment.paidAt)}</td>
                                        <td className="px-6 py-4 text-xs">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${getStatusBadge(payment.paymentStatus)}`}>
                                                {payment.paymentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-4">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border rounded disabled:opacity-50"
                                >
                                    Prev
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentManagement;