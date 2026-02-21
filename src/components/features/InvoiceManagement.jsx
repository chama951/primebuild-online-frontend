import {useEffect, useState, useMemo, useRef} from "react";
import DataTable from "../common/DataTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import Unauthorized from "../common/Unauthorized.jsx";
import InvoicePrintTemplate from "./invoice/InvoicePrintTemplate.jsx";
import {
    useGetInvoicesQuery,
    useUpdateInvoiceMutation,
    useDeleteInvoiceMutation
} from "../../features/components/InvoiceApi.js";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const InvoiceManagement = ({refetchFlag, resetFlag}) => {
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoiceStatus, setInvoiceStatus] = useState("NOT_PAID");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({show: false, type: "", message: "", action: null});
    const printRef = useRef();

    const {data: invoices = [], error, refetch, isLoading} = useGetInvoicesQuery();
    const [updateInvoice] = useUpdateInvoiceMutation();
    const [deleteInvoice] = useDeleteInvoiceMutation();

    useEffect(() => {
        if (refetchFlag) {
            refetch();
            resetFlag();
        }
    }, [refetchFlag, resetFlag, refetch]);

    if (error?.status === 401 || error?.status === 403) return <Unauthorized/>;

    const filteredInvoices = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return invoices.filter(inv => {
            const statusMatch = filterStatus ? inv.invoiceStatus === filterStatus : true;
            const dateMatch = filterDate ? inv.createdAt?.split("T")[0] === filterDate : true;
            const userMatch = inv.user?.username?.toLowerCase().includes(term);
            const statusSearchMatch = inv.invoiceStatus?.toLowerCase().includes(term);
            return statusMatch && dateMatch && (userMatch || statusSearchMatch);
        });
    }, [invoices, searchTerm, filterStatus, filterDate]);

    const showNotification = (type, message, action = null) => setNotification({show: true, type, message, action});

    const handleConfirmAction = async () => {
        if (!notification.action) return;
        const {callback} = notification.action;
        setIsSubmitting(true);
        try {
            const result = await callback();
            showNotification("success", result?.message || notification.action.successMessage);
        } catch (err) {
            showNotification("error", err?.data?.message || notification.action.errorMessage);
        } finally {
            setIsSubmitting(false);
            setNotification(prev => ({...prev, action: null}));
        }
    };

    const handleSelectInvoice = invoice => {
        setSelectedInvoice(invoice);
        setInvoiceStatus(invoice.invoiceStatus);
    };

    const handleUpdate = async e => {
        e.preventDefault();
        if (!selectedInvoice) return;
        setIsSubmitting(true);
        try {
            const response = await updateInvoice({
                id: selectedInvoice.id,
                invoiceStatus,
                itemList: selectedInvoice.invoiceItems.map(item => ({
                    id: item.item.id,
                    quantity: item.invoiceQuantity.toString()
                }))
            }).unwrap();
            showNotification("success", response.message || "Invoice updated!");
            refetch();
        } catch (err) {
            showNotification("error", err?.data?.message || "Update failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = invoice => {
        showNotification(
            "error",
            `Are you sure you want to delete invoice #${invoice.id}?`,
            {
                callback: async () => {
                    const res = await deleteInvoice(invoice.id).unwrap();
                    if (selectedInvoice?.id === invoice.id) setSelectedInvoice(null);
                    refetch();
                    return res;
                },
                successMessage: "Invoice deleted successfully!",
                errorMessage: "Failed to delete invoice."
            }
        );
    };

    const handlePrint = async () => {
        if (!selectedInvoice) return;
        const element = printRef.current;
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save(`Invoice_${selectedInvoice.id}.pdf`);
    };

    const calculateTotal = invoice => invoice.invoiceItems?.reduce((acc, i) => acc + (i.subtotal || 0), 0).toFixed(2);

    const formatDate = dateStr => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString(); // keep default locale format
    };

    // Table columns - small font, compact padding, headers centered
    const columns = [
        {key: "id", header: "ID", render: inv => <div className="text-xs text-gray-500 text-center">#{inv.id}</div>},
        {
            key: "user",
            header: "User",
            render: inv => <div className="text-xs font-medium text-center">{inv.user?.username || "N/A"}</div>
        },
        {
            key: "status", header: "Status", render: inv => (
                <div className="text-center">
                    <span
                        className={`px-1 py-0.5 rounded text-[10px] font-medium ${inv.invoiceStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {inv.invoiceStatus}
                    </span>
                </div>
            )
        },
        {
            key: "total",
            header: "Total (Rs)",
            render: inv => <div className="text-xs font-medium text-center">Rs {calculateTotal(inv)}</div>
        },
        {
            key: "createdAt",
            header: "Created At",
            render: inv => <div className="text-xs text-center">{formatDate(inv.createdAt)}</div>
        }
    ];

    return (
        <div className="container mx-auto p-4 space-y-6 text-base">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT - Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg border p-4 flex gap-4 items-center">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search user or status..."
                                className="w-full h-10 pl-4 pr-10 border rounded"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Status Dropdown */}
                        <select
                            className="h-10 w-48 p-2 border rounded"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="PAID">PAID</option>
                            <option value="NOT_PAID">NOT_PAID</option>
                        </select>

                        {/* Date Input */}
                        <input
                            type="date"
                            className="h-10 w-48 p-2 border rounded"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                        />
                    </div>

                    <DataTable
                        items={filteredInvoices}
                        selectedItem={selectedInvoice}
                        onSelectItem={handleSelectInvoice}
                        onDeleteItemClick={handleDelete}
                        columns={columns.map(col => ({...col,}))}
                        emptyMessage={isLoading ? "Loading..." : "No invoices found"}
                    />
                </div>

                <div className="space-y-4 bg-white rounded-lg border p-4">
                    <button
                        type="button"
                        onClick={handlePrint}
                        disabled={!selectedInvoice}
                        className={`w-full py-2 rounded text-white ${selectedInvoice ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
                    >
                        Print Invoice
                    </button>

                    {selectedInvoice ? (
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">Invoice Status</label>
                                <select
                                    className="w-full p-2 border rounded text-base"
                                    value={invoiceStatus}
                                    onChange={e => setInvoiceStatus(e.target.value)}
                                >
                                    <option value="NOT_PAID">NOT_PAID</option>
                                    <option value="PAID">PAID</option>
                                </select>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Invoice Items</h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {selectedInvoice.invoiceItems.map(item => (
                                        <div key={item.id}
                                             className="p-2 border rounded grid grid-cols-2 gap-2 bg-gray-50 text-base">
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

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {isSubmitting ? "Updating..." : "Update"}
                            </button>
                        </form>
                    ) : (
                        <div className="text-gray-500">Select an invoice from table to view details.</div>
                    )}
                </div>
            </div>

            <div style={{position: "absolute", left: "-9999px"}}>
                <InvoicePrintTemplate ref={printRef} invoice={selectedInvoice}/>
            </div>

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
        </div>
    );
};

export default InvoiceManagement;