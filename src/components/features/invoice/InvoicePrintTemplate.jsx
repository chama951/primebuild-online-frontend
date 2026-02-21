import React, { forwardRef } from "react";

const InvoicePrintTemplate = forwardRef(({ invoice }, ref) => {
    if (!invoice) return null;

    const total = invoice.invoiceItems?.reduce(
        (acc, i) => acc + (i.subtotal || 0),
        0
    );

    return (
        <div
            ref={ref}
            className="p-8 bg-white text-black"
            style={{ width: "800px" }}
        >
            <h2 className="text-2xl font-bold mb-4 text-center">
                PRIME BUILD INVOICE
            </h2>

            <div className="mb-4 text-sm">
                <p><strong>Invoice ID:</strong> #{invoice.id}</p>
                <p>
                    <strong>Created At:</strong>{" "}
                    {new Date(invoice.createdAt).toLocaleString()}
                </p>
                <p><strong>Status:</strong> {invoice.invoiceStatus}</p>
                <p><strong>Customer:</strong> {invoice.user?.username}</p>
                <p><strong>Billing Address:</strong> {invoice.billingAddress || "-"}</p>
            </div>

            <table className="w-full border text-sm">
                <thead>
                <tr className="bg-gray-200">
                    <th className="border p-2">Item</th>
                    <th className="border p-2">Qty</th>
                    <th className="border p-2">Unit Price</th>
                    <th className="border p-2">Discount</th>
                    <th className="border p-2">Subtotal</th>
                </tr>
                </thead>
                <tbody>
                {invoice.invoiceItems.map((item) => (
                    <tr key={item.id}>
                        <td className="border p-2">{item.item.itemName}</td>
                        <td className="border p-2 text-center">
                            {item.invoiceQuantity}
                        </td>
                        <td className="border p-2 text-right">
                            Rs {item.unitPrice.toLocaleString()}
                        </td>
                        <td className="border p-2 text-right">
                            Rs {item.discountSubTotal.toLocaleString()}
                        </td>
                        <td className="border p-2 text-right">
                            Rs {item.subtotal.toLocaleString()}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="text-right mt-4 text-lg font-semibold">
                Total: Rs {total.toLocaleString()}
            </div>

            <div className="mt-6 text-xs text-center text-gray-500">
                Thank you for shopping with Prime Build.
            </div>
        </div>
    );
});

export default InvoicePrintTemplate;