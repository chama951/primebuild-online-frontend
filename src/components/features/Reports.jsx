import React, {useState, useEffect} from "react";
import {
    useGetPaymentsQuery,
    useGetPaymentsByDateQuery,
    useGetPaymentsByStatusQuery,
    useGetPaymentsByUsernameQuery,
} from "../../features/components/paymentApi.js";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import {
    Download,
    Calendar,
    Filter,
    DollarSign,
    BarChart3,
    CreditCard,
    TrendingUp
} from "lucide-react";
import Unauthorized from "../common/Unauthorized.jsx";

const Reports = ({refetchFlag, resetFlag}) => {
    // State
    const [dateRange, setDateRange] = useState({
        startDate: "",
        endDate: ""
    });
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedUsername, setSelectedUsername] = useState("");
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
        error: errorAll,
        refetch: refetchAll
    } = useGetPaymentsQuery();

    const {
        data: paymentsByDate = [],
        isLoading: loadingByDate,
        error: errorByDate,
        refetch: refetchByDate
    } = useGetPaymentsByDateQuery(dateRange.startDate, {
        skip: !dateRange.startDate
    });

    const {
        data: paymentsByStatus = [],
        isLoading: loadingByStatus,
        error: errorByStatus,
        refetch: refetchByStatus
    } = useGetPaymentsByStatusQuery(selectedStatus, {
        skip: !selectedStatus
    });

    const {
        data: paymentsByUsername = [],
        isLoading: loadingByUsername,
        error: errorByUsername,
        refetch: refetchByUsername
    } = useGetPaymentsByUsernameQuery(selectedUsername, {
        skip: !selectedUsername
    });

    // Determine which payments to use based on filters
    const getPayments = () => {
        if (selectedUsername) {
            return paymentsByUsername;
        } else if (selectedStatus && dateRange.startDate) {
            return paymentsByDate.filter(p => p.paymentStatus === selectedStatus);
        } else if (selectedStatus) {
            return paymentsByStatus;
        } else if (dateRange.startDate) {
            return paymentsByDate;
        } else {
            return allPayments;
        }
    };

    const isLoading = () => {
        if (selectedUsername) return loadingByUsername;
        if (selectedStatus && dateRange.startDate) return loadingByDate || loadingByStatus;
        if (selectedStatus) return loadingByStatus;
        if (dateRange.startDate) return loadingByDate;
        return loadingAll;
    };

    const payments = getPayments();
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
            if (selectedUsername) {
                await refetchByUsername();
            } else if (selectedStatus) {
                await refetchByStatus();
            } else if (dateRange.startDate) {
                await refetchByDate();
            } else {
                await refetchAll();
            }
        } catch (error) {
            console.error("Error refetching:", error);
        }
    };

    const error = errorAll || errorByDate || errorByStatus || errorByUsername;

    if (error?.status === 401 || error?.status === 403) {
        return <Unauthorized/>;
    }

    // Calculate report data
    const calculateReportData = () => {
        const totalPayments = payments.length;
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

        // Status breakdown
        const statusBreakdown = {
            PAID: payments.filter(p => p.paymentStatus === "PAID").length,
            PENDING: payments.filter(p => p.paymentStatus === "PENDING").length,
            CANCELLED: payments.filter(p => p.paymentStatus === "CANCELLED").length,
            REFUNDED: payments.filter(p => p.paymentStatus === "REFUNDED").length,
        };

        // Amount by status
        const amountByStatus = {
            PAID: payments.filter(p => p.paymentStatus === "PAID").reduce((sum, p) => sum + p.amount, 0),
            PENDING: payments.filter(p => p.paymentStatus === "PENDING").reduce((sum, p) => sum + p.amount, 0),
            CANCELLED: payments.filter(p => p.paymentStatus === "CANCELLED").reduce((sum, p) => sum + p.amount, 0),
            REFUNDED: payments.filter(p => p.paymentStatus === "REFUNDED").reduce((sum, p) => sum + p.amount, 0),
        };

        return {
            totalPayments,
            totalAmount,
            statusBreakdown,
            amountByStatus,
        };
    };

    const reportData = calculateReportData();

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Date', 'Payment ID', 'User', 'Email', 'Amount', 'Currency', 'Status'];
        const rows = payments.map(p => [
            new Date(p.paidAt).toLocaleDateString(),
            p.id,
            p.user?.username || 'N/A',
            p.user?.email || 'N/A',
            p.amount,
            p.currency,
            p.paymentStatus
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], {type: 'text/csv'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Format currency - Show Rs symbol
    const formatCurrency = (amount, currency = "LKR") => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount).replace('LKR', 'Rs');
    };

    // Format amount without currency symbol (for Total Amount card)
    const formatAmountWithoutSymbol = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Format percentage
    const formatPercentage = (value, total) => {
        if (total === 0) return "0%";
        return `${((value / total) * 100).toFixed(1)}%`;
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

    // Clear all filters
    const handleClearFilters = () => {
        setDateRange({startDate: "", endDate: ""});
        setSelectedStatus("");
        setSelectedUsername("");
    };

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
            <div className="bg-white rounded-lg border p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    {/* Date Range - 5 columns */}
                    <div className="md:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date Range
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    className="w-full pl-8 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                                />
                                <Calendar className="absolute left-2 top-3 w-4 h-4 text-gray-400"/>
                            </div>
                            <span className="text-gray-500 self-center">—</span>
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    className="w-full pl-8 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                                />
                                <Calendar className="absolute left-2 top-3 w-4 h-4 text-gray-400"/>
                            </div>
                        </div>
                    </div>

                    {/* Status Filter - 3 columns */}
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Status
                        </label>
                        <select
                            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">PENDING</option>
                            <option value="PAID">PAID</option>
                            <option value="CANCELLED">CANCELLED</option>
                            <option value="REFUNDED">REFUNDED</option>
                        </select>
                    </div>

                    {/* Username Filter - 2 columns */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            placeholder="Enter username"
                            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            value={selectedUsername}
                            onChange={(e) => setSelectedUsername(e.target.value)}
                        />
                    </div>

                    {/* Clear Filters - 2 columns */}
                    <div className="md:col-span-2">
                        <button
                            onClick={handleClearFilters}
                            className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!dateRange.startDate && !selectedStatus && !selectedUsername}
                        >
                            <Filter className="w-4 h-4"/>
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Generating reports...</span>
                </div>
            )}

            {!loading && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Total Payments Card */}
                        <div className="bg-white rounded-lg border p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Total Payments</p>
                                    <p className="text-3xl font-bold text-gray-800">{reportData.totalPayments}</p>
                                    <p className="text-xs text-gray-400 mt-1">All transactions</p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-full">
                                    <CreditCard className="w-6 h-6 text-blue-600"/>
                                </div>
                            </div>
                        </div>

                        {/* Total Amount Card - Now with Rs symbol */}
                        <div className="bg-white rounded-lg border p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Total Amount</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        Rs {formatAmountWithoutSymbol(reportData.totalAmount)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">Sum of all payments</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-full">
                                    <TrendingUp className="w-6 h-6 text-green-600"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Distribution Graph */}
                    <div className="bg-white rounded-lg border p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-600"/>
                            Payment Status Distribution
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(reportData.statusBreakdown).map(([status, count]) => (
                                <div key={status} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${
                                                status === 'PAID' ? 'bg-green-500' :
                                                    status === 'PENDING' ? 'bg-yellow-500' :
                                                        status === 'CANCELLED' ? 'bg-red-500' :
                                                            'bg-purple-500'
                                            }`}></span>
                                            <span className="text-sm font-medium text-gray-700">{status}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-600">{count} payments</span>
                                            <span className="text-sm font-semibold text-blue-600 w-16 text-right">
                                                {formatPercentage(count, reportData.totalPayments)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-500 ${
                                                status === 'PAID' ? 'bg-green-500' :
                                                    status === 'PENDING' ? 'bg-yellow-500' :
                                                        status === 'CANCELLED' ? 'bg-red-500' :
                                                            'bg-purple-500'
                                            }`}
                                            style={{width: `${(count / reportData.totalPayments) * 100}%`}}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Amount by Status Graph */}
                    <div className="bg-white rounded-lg border p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600"/>
                            Amount by Status
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(reportData.amountByStatus).map(([status, amount]) => (
                                <div key={status} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${
                                                status === 'PAID' ? 'bg-green-500' :
                                                    status === 'PENDING' ? 'bg-yellow-500' :
                                                        status === 'CANCELLED' ? 'bg-red-500' :
                                                            'bg-purple-500'
                                            }`}></span>
                                            <span className="text-sm font-medium text-gray-700">{status}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-semibold text-green-600">
                                                {formatCurrency(amount)}
                                            </span>
                                            <span className="text-sm text-gray-500 w-16 text-right">
                                                {formatPercentage(amount, reportData.totalAmount)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full transition-all duration-500 ${
                                                status === 'PAID' ? 'bg-green-500' :
                                                    status === 'PENDING' ? 'bg-yellow-500' :
                                                        status === 'CANCELLED' ? 'bg-red-500' :
                                                            'bg-purple-500'
                                            }`}
                                            style={{width: `${(amount / reportData.totalAmount) * 100}%`}}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Stats Footer */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div
                            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-blue-700 font-medium">PAID Amount</p>
                            <p className="text-2xl font-bold text-blue-800">{formatCurrency(reportData.amountByStatus.PAID)}</p>
                        </div>
                        <div
                            className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                            <p className="text-sm text-yellow-700 font-medium">PENDING Amount</p>
                            <p className="text-2xl font-bold text-yellow-800">{formatCurrency(reportData.amountByStatus.PENDING)}</p>
                        </div>
                        <div
                            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                            <p className="text-sm text-purple-700 font-medium">REFUNDED + CANCELLED</p>
                            <p className="text-2xl font-bold text-purple-800">
                                {formatCurrency(reportData.amountByStatus.REFUNDED + reportData.amountByStatus.CANCELLED)}
                            </p>
                        </div>
                    </div>

                    {/* Export CSV Button at Bottom */}
                    <div className="flex justify-end">
                        <button
                            onClick={exportToCSV}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors shadow-sm"
                            disabled={payments.length === 0}
                        >
                            <Download className="w-5 h-5"/>
                            Export CSV
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;