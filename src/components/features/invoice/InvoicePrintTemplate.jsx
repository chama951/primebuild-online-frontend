import React, {forwardRef} from "react";
import PrimeBuildBanner from "../../../assets/primebuild_banner-cropped.svg";

const InvoicePrintTemplate = forwardRef(({invoice}, ref) => {
    if (!invoice) return null;

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-LK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount || 0);

    const total = invoice.invoiceItems?.reduce(
        (acc, i) => acc + (i.subtotal || 0),
        0
    );

    return (
        <div
            ref={ref}
            className="p-6 bg-white text-black shadow-lg rounded-md"
            style={{width: "800px", fontFamily: "Arial, sans-serif"}}
        >
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">INVOICE</h1>
                <img
                    src={PrimeBuildBanner}
                    alt="Prime Build Banner"
                    className="h-12 w-auto object-contain"
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="space-y-1">
                    <p><strong>Invoice ID:</strong> #{invoice.id}</p>
                    <p><strong>Created At:</strong> {new Date(invoice.createdAt).toLocaleString()}</p>
                    <p><strong>Status:</strong> {invoice.invoiceStatus}</p>
                </div>
                <div className="space-y-1">
                    <p><strong>Customer:</strong> {invoice.user?.username || "-"}</p>
                    <p><strong>Billing Address:</strong> {invoice.billingAddress || "-"}</p>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 text-sm">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left border-b">Item</th>
                        <th className="p-2 text-center border-b">Qty</th>
                        <th className="p-2 text-right border-b">Unit Price</th>
                        <th className="p-2 text-right border-b">Discount</th>
                        <th className="p-2 text-right border-b">Subtotal</th>
                    </tr>
                    </thead>
                    <tbody>
                    {invoice.invoiceItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-2 border-b">{item.item.manufacturer?.manufacturerName} {item.item.itemName}</td>
                            <td className="p-2 border-b text-center">{item.invoiceQuantity}</td>
                            <td className="p-2 border-b text-right">Rs {formatCurrency(item.unitPrice)}</td>
                            <td className="p-2 border-b text-right">Rs {formatCurrency(item.discountSubTotal)}</td>
                            <td className="p-2 border-b text-right font-semibold">Rs {formatCurrency(item.subtotal)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-right text-lg font-bold">
                Total: Rs {formatCurrency(total)}
            </div>

            <div className="mt-6 text-center text-gray-500 text-xs">
                Thank you for shopping with <span className="font-semibold">Prime Build</span>.
            </div>
        </div>
    );
});

export default InvoicePrintTemplate;