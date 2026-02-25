import {useState, useRef, useMemo} from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InvoicePrintTemplate from "./invoice/InvoicePrintTemplate.jsx";

const InvoiceDetails = ({invoice, onClose, onUpdate, isSubmitting}) => {
    const [invoiceStatus, setInvoiceStatus] = useState(invoice.invoiceStatus);
    const printRef = useRef();

    if (!invoice) return null;

    const totalAmount = useMemo(() => {
        return invoice.invoiceItems
            ?.reduce((acc, item) => acc + (item.subtotal || 0), 0)
            .toFixed(2);
    }, [invoice]);

    const handlePrint = async () => {
        const element = printRef.current;
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save(`Invoice_${invoice.id}.pdf`);
    };

    const handleUpdate = () => {
        onUpdate(invoiceStatus);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-start pt-10 overflow-auto">
            <div className="bg-white rounded-lg shadow-md max-w-5xl w-full p-6 relative">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-xl font-bold"
                >
                    ×
                </button>

                <h2 className="text-2xl font-semibold text-gray-800 mb-1">
                    Invoice #{invoice.id}
                </h2>

                <p className="text-sm text-gray-500 mb-4">
                    User:{" "}
                    <span className="font-medium text-gray-700">
                        {invoice.user?.username || "N/A"}
                    </span>{" "}
                    | Created:{" "}
                    <span className="font-medium text-gray-700">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                    </span>
                </p>

                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">

                    <div className="flex items-center gap-3 flex-wrap">

                        <span
                            className={`px-3 py-1 rounded text-sm font-semibold ${
                                invoiceStatus === "PAID"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                            {invoiceStatus}
                        </span>

                        <select
                            value={invoiceStatus}
                            onChange={(e) => setInvoiceStatus(e.target.value)}
                            className="p-2 border rounded text-sm"
                        >
                            <option value="NOT_PAID">NOT_PAID</option>
                            <option value="PAID">PAID</option>
                        </select>

                        <button
                            onClick={handleUpdate}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                        >
                            {isSubmitting ? "Updating..." : "Update"}
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-lg font-semibold text-gray-800">
                            Total:{" "}
                            <span className="text-green-600">
                                Rs {Number(totalAmount).toLocaleString()}
                            </span>
                        </div>

                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                        >
                            Print
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {invoice.invoiceItems.map((item) => {
                        const discountedUnit =
                            item.unitPrice - item.discountPerUnite;

                        return (
                            <div
                                key={item.id}
                                className="border border-gray-200 rounded p-4 shadow-sm hover:shadow transition bg-white flex flex-col justify-between"
                            >
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    {item.item.component?.componentName || "N/A"}
                                </div>

                                <h3 className="font-semibold text-base text-gray-800 mb-1 truncate">
                                    {item.item.itemName}
                                </h3>

                                <p className="text-gray-500 text-sm mb-1">
                                    Manufacturer:{" "}
                                    <span className="font-medium text-gray-700">
                                        {item.item.manufacturer?.manufacturerName || "-"}
                                    </span>
                                </p>

                                <p className="text-gray-600 text-sm">
                                    Qty:{" "}
                                    <span className="font-medium">
                                        {item.invoiceQuantity}
                                    </span>
                                </p>

                                <p className="text-gray-600 text-sm">
                                    Unit Price:{" "}
                                    <span className="font-medium">
                                        Rs {item.unitPrice.toLocaleString()}
                                    </span>
                                </p>

                                {item.discountPerUnite > 0 && (
                                    <p className="text-green-600 text-sm">
                                        Discounted: Rs{" "}
                                        {discountedUnit.toLocaleString()}
                                    </p>
                                )}

                                <div className="mt-2 text-sm font-semibold text-gray-800">
                                    Subtotal: Rs {item.subtotal.toLocaleString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{position: "absolute", left: "-9999px"}}>
                <InvoicePrintTemplate ref={printRef} invoice={invoice}/>
            </div>
        </div>
    );
};

export default InvoiceDetails;