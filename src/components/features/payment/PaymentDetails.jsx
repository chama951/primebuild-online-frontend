import React, { useEffect, useState, useMemo } from "react";
import {
    useGetPaymentByIdQuery,
    useUpdatePaymentMutation,
} from "../../../services/paymentApi.js";
import NotificationDialogs from "../../common/NotificationDialogs.jsx";

const PaymentDetails = ({ paymentId, onClose, refetchPayments }) => {
    const { data: payment, isLoading, error } = useGetPaymentByIdQuery(paymentId);
    const [updatePayment, { isLoading: updating }] = useUpdatePaymentMutation();

    const [editingStatus, setEditingStatus] = useState("");
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        action: null,
    });

    useEffect(() => {
        if (payment) setEditingStatus(payment.paymentStatus);
    }, [payment]);

    const showNotification = (type, message) => {
        setNotification({ show: true, type, message, action: null });
    };

    const handleUpdateStatus = async () => {
        try {
            const response = await updatePayment({
                id: payment.id,
                paymentStatus: editingStatus,
            }).unwrap();
            showNotification("success", response.message || "Payment updated successfully!");
            refetchPayments();
            onClose(); // close modal
        } catch (err) {
            console.error(err);
            showNotification("error", err.data?.message || "Failed to update payment.");
        }
    };

    const formatCurrency = (amount, currency = "LKR") =>
        new Intl.NumberFormat("en-LK", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);

    const totalAmount = useMemo(() => {
        return payment?.invoice?.invoiceItems
            ?.reduce((acc, item) => acc + (item.subtotal || 0), 0)
            .toFixed(2);
    }, [payment]);

    if (isLoading) return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">Loading payment...</div>
        </div>
    );

    if (error) return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">Error loading payment.</div>
        </div>
    );

    return (
        <>
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                errorMessage={notification.message}
            />

            <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-start pt-10 overflow-auto">
                <div className="bg-white rounded-lg shadow-md max-w-5xl w-full p-6 relative">

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-xl font-bold"
                    >
                        ×
                    </button>

                    <h2 className="text-2xl font-semibold text-gray-800 mb-1">
                        Payment #{payment.id}
                    </h2>

                    <p className="text-sm text-gray-500 mb-4">
                        User: <span className="font-medium text-gray-700">{payment.user?.username || "N/A"}</span> |
                        Paid At: <span className="font-medium text-gray-700">{new Date(payment.paidAt).toLocaleString()}</span>
                    </p>

                    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className={`px-3 py-1 rounded text-sm font-semibold ${
                                editingStatus === "PAID" ? "bg-green-100 text-green-700" :
                                    editingStatus === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                        editingStatus === "CANCELLED" ? "bg-red-100 text-red-700" :
                                            editingStatus === "REFUNDED" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                            }`}>
                                {editingStatus}
                            </span>

                            <select
                                value={editingStatus}
                                onChange={(e) => setEditingStatus(e.target.value)}
                                className="p-2 border rounded text-sm"
                                disabled={updating}
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="PAID">PAID</option>
                                <option value="CANCELLED">CANCELLED</option>
                                <option value="REFUNDED">REFUNDED</option>
                            </select>

                            <button
                                onClick={handleUpdateStatus}
                                disabled={updating}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                            >
                                {updating ? "Updating..." : "Update"}
                            </button>
                        </div>

                        <div className="text-lg font-semibold text-gray-800">
                            Total: <span className="text-green-600">Rs {formatCurrency(totalAmount)}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                            </tr>
                            </thead>
                            <tbody>
                            {payment.invoice?.invoiceItems.map((item) => (
                                <tr key={item.id} className="bg-white divide-y divide-gray-200">
                                    <td className="px-4 py-2 text-sm">{item.item.itemName}</td>
                                    <td className="px-4 py-2 text-sm">{item.invoiceQuantity}</td>
                                    <td className="px-4 py-2 text-sm">{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-4 py-2 text-sm">{formatCurrency(item.subtotal)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <p className="mt-2 font-semibold text-right">Total: {formatCurrency(payment.invoice?.totalAmount)}</p>
                    </div>

                </div>
            </div>
        </>
    );
};

export default PaymentDetails;