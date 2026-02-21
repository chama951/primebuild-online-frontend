import {useEffect, useMemo, useState} from "react";
import DataTable from "../common/DataTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import {
    useGetInvoicesQuery,
    useUpdateInvoiceMutation,
    useDeleteInvoiceMutation,
} from "../../features/components/InvoiceApi.js";
import Unauthorized from "../common/Unauthorized.jsx";

const InvoiceManagement = ({refetchFlag, resetFlag}) => {

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoiceStatus, setInvoiceStatus] = useState("NOT_PAID");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState(""); // "" = all
    const [filterDate, setFilterDate] = useState(""); // "" = all
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        action: null,
    });

    const {
        data: invoices = [],
        error,
        refetch,
    } = useGetInvoicesQuery();

    const [updateInvoice] = useUpdateInvoiceMutation();
    const [deleteInvoice] = useDeleteInvoiceMutation();

    useEffect(() => {
        if (refetchFlag) {
            refetch();
            resetFlag();
        }
    }, [refetchFlag]);

    if (error?.isUnauthorized) return <Unauthorized/>;

    const filteredInvoices = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return invoices.filter((inv) => {

            const statusMatch = filterStatus ? inv.invoiceStatus === filterStatus : true;
            const dateMatch = filterDate ? inv.invoiceDate === filterDate : true;

            const userMatch = inv.user?.username?.toLowerCase().includes(term);
            const searchStatusMatch = inv.invoiceStatus?.toLowerCase().includes(term);
            const globalMatch = userMatch || searchStatusMatch;

            return statusMatch && dateMatch && globalMatch;
        });
    }, [invoices, searchTerm, filterStatus, filterDate]);

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
        } catch (error) {
            showNotification(
                "error",
                error?.data?.message || notification.action.errorMessage
            );
        } finally {
            setIsSubmitting(false);
            setNotification((prev) => ({...prev, action: null}));
        }
    };

    const handleSelectInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setInvoiceStatus(invoice.invoiceStatus);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        setIsSubmitting(true);

        try {
            const body = {
                invoiceStatus,
                itemList: selectedInvoice.invoiceItems.map((item) => ({
                    id: item.item.id,
                    quantity: item.invoiceQuantity.toString(),
                })),
            };

            const response = await updateInvoice({
                id: selectedInvoice.id,
                ...body,
            }).unwrap();

            showNotification("success", response.message || "Invoice updated!");
            refetch();
        } catch (error) {
            showNotification("error", error?.data?.message || "Update failed.");
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
                    const response = await deleteInvoice(invoice.id).unwrap();
                    refetch();
                    if (selectedInvoice?.id === invoice.id) {
                        setSelectedInvoice(null);
                    }
                    return response;
                },
                successMessage: "Invoice deleted successfully!",
                errorMessage: "Failed to delete invoice.",
            }
        );
    };

    const handleResetForm = () => {
        setSelectedInvoice(null);
        setInvoiceStatus("NOT_PAID");
    };

    const columns = [
        {
            key: "invoiceDate",
            header: "Day",
            render: (item) => <div className="text-sm">{item.invoiceDate}</div>,
        },
        {
            key: "invoiceStatus",
            header: "Status",
            render: (item) => (
                <span
                    className={`px-2 py-1 rounded text-xs ${
                        item.invoiceStatus === "PAID"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                    }`}
                >
                    {item.invoiceStatus}
                </span>
            ),
        },
        {
            key: "user",
            header: "User",
            render: (item) => item.user?.username || "-",
        },
        {
            key: "total",
            header: "Total (Rs)",
            render: (item) =>
                item.invoiceItems
                    ?.reduce((acc, i) => acc + (i.subtotal || 0), 0)
                    .toLocaleString("en-US", {minimumFractionDigits: 2})
                    .replace(/^/, "Rs "),
        },
    ];

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-4">

                    <div className="bg-white rounded-lg border p-4 flex flex-col lg:flex-row gap-2">

                        <input
                            type="text"
                            placeholder="Search by User or Status..."
                            className="flex-1 p-2 border rounded"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <select
                            className="p-2 border rounded"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="PAID">PAID</option>
                            <option value="NOT_PAID">NOT_PAID</option>
                        </select>

                        <input
                            type="date"
                            className="p-2 border rounded"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>

                    <DataTable
                        items={filteredInvoices}
                        selectedItem={selectedInvoice}
                        onSelectItem={handleSelectInvoice}
                        onDeleteItemClick={handleDelete}
                        columns={columns}
                        emptyMessage="No invoices found"
                    />
                </div>

                <div className="space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                        {selectedInvoice ? (
                            <form onSubmit={handleUpdate} className="space-y-4">

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Invoice Status
                                    </label>
                                    <select
                                        className="w-full p-2 border rounded"
                                        value={invoiceStatus}
                                        onChange={(e) => setInvoiceStatus(e.target.value)}
                                    >
                                        <option value="NOT_PAID">NOT_PAID</option>
                                        <option value="PAID">PAID</option>
                                    </select>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium mb-2">
                                        Invoice Items
                                    </h4>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                        {selectedInvoice.invoiceItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="p-3 border rounded shadow-sm bg-gray-50 grid grid-cols-2 gap-2 text-sm text-gray-700"
                                            >
                                                <div>Item Name:</div>
                                                <div>{item.item.itemName}</div>

                                                <div>Quantity:</div>
                                                <div>{item.invoiceQuantity}</div>

                                                <div>Unit Price:</div>
                                                <div>Rs {item.unitPrice.toLocaleString()}</div>

                                                <div>Discount/Unit:</div>
                                                <div>Rs {item.discountPerUnite.toLocaleString()}</div>

                                                <div>Discount Total:</div>
                                                <div>Rs {item.discountSubTotal.toLocaleString()}</div>

                                                <div>Subtotal:</div>
                                                <div>Rs {item.subtotal.toLocaleString()}</div>

                                                <div>Component:</div>
                                                <div>{item.item.component?.componentName || "-"}</div>

                                                <div>Manufacturer:</div>
                                                <div>{item.item.manufacturer?.manufacturerName || "-"}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        {isSubmitting ? "..." : "Update"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleResetForm}
                                        className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-gray-500 text-sm">
                                Select an invoice to edit.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() =>
                    setNotification({show: false, type: "", message: "", action: null})
                }
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() =>
                    setNotification({show: false, type: "", message: "", action: null})
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
