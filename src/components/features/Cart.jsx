import { useState } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import {
    useGetCartQuery,
    useCreateOrUpdateCartMutation,
} from "../../services/cartApi.js";
import { useCreateInvoiceMutation } from "../../services/InvoiceApi.js";
import NotificationDialogs from "../common/NotificationDialogs.jsx";

const Cart = ({ roles = [] }) => {
    const { data: cart, isLoading, isError } = useGetCartQuery();
    const [updateCart] = useCreateOrUpdateCartMutation();
    const [createInvoice] = useCreateInvoiceMutation();

    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorAction, setErrorAction] = useState(false);
    const [onErrorAction, setOnErrorAction] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const isOnlyCustomer = roles.length === 1 && roles.includes("CUSTOMER");

    if (isLoading) return <div className="p-6 text-lg">Loading cart...</div>;
    if (isError) return <div className="p-6 text-red-500 text-lg">Failed to load cart.</div>;

    const cartItems = cart?.cartItemList || [];

    const extractErrorMessage = (err) =>
        err?.data?.message || "Something went wrong.";

    const buildRequestBody = (items) => ({
        itemList: items.map((item) => ({
            id: item.item.id,
            quantity: item.cartQuantity,
        })),
    });

    const changeQuantity = async (cartItem, newQty) => {
        if (newQty < 1) return;

        const updatedItems = cartItems.map((item) =>
            item.item.id === cartItem.item.id
                ? { ...item, cartQuantity: newQty }
                : item
        );

        try {
            await updateCart(buildRequestBody(updatedItems)).unwrap();
            setSuccessMessage("Cart updated successfully.");
            setShowSuccessDialog(true);
        } catch (err) {
            setErrorMessage(extractErrorMessage(err));
            setShowErrorDialog(true);
        }
    };

    const removeItem = (cartItemId) => {
        setErrorMessage("Are you sure you want to remove this item?");
        setErrorAction(true);
        setShowErrorDialog(true);

        setOnErrorAction(() => async () => {
            setIsActionLoading(true);
            try {
                const updatedItems = cartItems.filter(
                    (item) => item.id !== cartItemId
                );

                await updateCart(buildRequestBody(updatedItems)).unwrap();

                setShowErrorDialog(false);
                setSuccessMessage("Item removed successfully.");
                setShowSuccessDialog(true);
            } catch (err) {
                setErrorMessage(extractErrorMessage(err));
                setErrorAction(false);
                setShowErrorDialog(true);
            } finally {
                setIsActionLoading(false);
            }
        });
    };

    const clearCart = () => {
        setErrorMessage("Are you sure you want to clear the entire cart?");
        setErrorAction(true);
        setShowErrorDialog(true);

        setOnErrorAction(() => async () => {
            setIsActionLoading(true);
            try {
                await updateCart({ itemList: [] }).unwrap();

                setShowErrorDialog(false);
                setSuccessMessage("Cart cleared successfully.");
                setShowSuccessDialog(true);
            } catch (err) {
                setErrorMessage(extractErrorMessage(err));
                setErrorAction(false);
                setShowErrorDialog(true);
            } finally {
                setIsActionLoading(false);
            }
        });
    };

    const handleCreateInvoice = async () => {
        if (cartItems.length === 0) {
            setErrorMessage("Cart is empty. Cannot create invoice.");
            setShowErrorDialog(true);
            return;
        }

        setIsActionLoading(true);
        try {
            const payload = {
                invoiceStatus: "NOT_PAID",
                itemList: cartItems.map((item) => ({
                    id: item.item.id,
                    quantity: item.cartQuantity,
                })),
            };

            await createInvoice(payload).unwrap();

            await updateCart({ itemList: [] }).unwrap();

            setSuccessMessage("Invoice created successfully and cart cleared!");
            setShowSuccessDialog(true);
        } catch (err) {
            setErrorMessage(err?.data?.message || "Failed to create invoice.");
            setShowErrorDialog(true);
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 text-base">
            {cartItems.length === 0 ? (
                <div className="text-gray-500 text-lg">Your cart is empty.</div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-3">
                        {cartItems.map((cartItem) => (
                            <div
                                key={cartItem.id}
                                className="flex justify-between items-center bg-white shadow-sm rounded-lg p-5 text-base"
                            >
                                <div className="flex-1">
                                    <h2 className="font-medium text-lg">
                                        {cartItem.item.itemName}
                                    </h2>

                                    <p className="text-gray-700">
                                        Price: Rs. {cartItem.unitPrice?.toLocaleString()}
                                    </p>

                                    <p className="text-green-600 text-sm">
                                        Discount: Rs.{" "}
                                        {cartItem.discountSubTotal?.toLocaleString()}
                                    </p>

                                    <p className="text-gray-500">
                                        Subtotal: Rs. {cartItem.subtotal?.toLocaleString()}
                                    </p>

                                    <div className="flex items-center gap-2 mt-3">
                                        <button
                                            onClick={() =>
                                                changeQuantity(
                                                    cartItem,
                                                    cartItem.cartQuantity - 1
                                                )
                                            }
                                            className="p-1 border rounded hover:bg-gray-100 transition"
                                        >
                                            <Minus size={16} />
                                        </button>

                                        <span className="px-2 font-medium text-lg">
                      {cartItem.cartQuantity}
                    </span>

                                        <button
                                            onClick={() =>
                                                changeQuantity(
                                                    cartItem,
                                                    cartItem.cartQuantity + 1
                                                )
                                            }
                                            className="p-1 border rounded hover:bg-gray-100 transition"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => removeItem(cartItem.id)}
                                    className="text-red-500 hover:text-red-700 ml-4"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white shadow rounded-lg p-5 h-fit flex flex-col gap-2">
                        <div className="flex justify-between font-medium text-lg">
                            <span>Total Discount</span>
                            <span className="text-green-600">
                Rs. {cart?.discountAmount?.toLocaleString() || 0}
              </span>
                        </div>

                        <div className="flex justify-between font-semibold text-xl">
                            <span>Total</span>
                            <span>
                Rs. {cart?.totalAmount?.toLocaleString() || 0}
              </span>
                        </div>

                        <button
                            onClick={handleCreateInvoice}
                            disabled={isOnlyCustomer || cartItems.length === 0}
                            className={`w-full py-2 rounded text-white font-medium transition ${
                                isOnlyCustomer || cartItems.length === 0
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            Create Invoice
                        </button>

                        <button
                            onClick={clearCart}
                            className="w-full py-2 rounded border border-red-500 text-red-500 hover:bg-red-50 font-medium"
                        >
                            Clear Cart
                        </button>
                    </div>
                </div>
            )}

            <NotificationDialogs
                showSuccessDialog={showSuccessDialog}
                setShowSuccessDialog={() => setShowSuccessDialog(false)}
                successMessage={successMessage}
                showErrorDialog={showErrorDialog}
                setShowErrorDialog={() => {
                    setShowErrorDialog(false);
                    setErrorAction(false);
                }}
                errorMessage={errorMessage}
                errorAction={errorAction}
                onErrorAction={onErrorAction}
                isActionLoading={isActionLoading}
            />
        </div>
    );
};

export default Cart;