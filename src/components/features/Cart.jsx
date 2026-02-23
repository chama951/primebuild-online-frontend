import { useState } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import {
    useGetCartQuery,
    useDeleteCartMutation,
    useCreateOrUpdateCartMutation
} from "../../features/components/cartApi";
import NotificationDialogs from "../common/NotificationDialogs.jsx";

const Cart = () => {

    const { data: cart, isLoading, isError } = useGetCartQuery();
    const [deleteCart] = useDeleteCartMutation();
    const [updateCart] = useCreateOrUpdateCartMutation();

    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorAction, setErrorAction] = useState(false);
    const [onErrorAction, setOnErrorAction] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    if (isLoading) return <div className="p-6">Loading cart...</div>;
    if (isError) return <div className="p-6 text-red-500">Failed to load cart.</div>;

    const cartItems = cart?.cartItemList || [];

    const extractErrorMessage = (err) =>
        err?.data?.message || "Something went wrong.";

    const buildRequestBody = (updatedItems) => ({
        itemList: updatedItems.map(item => ({
            id: item.item.id,
            quantity: item.cartQuantity
        }))
    });

    // Change Quantity
    const changeQuantity = async (cartItem, newQty) => {
        if (newQty < 1) return;

        const updatedItems = cartItems.map(item =>
            item.id === cartItem.id
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
                    item => item.id !== cartItemId
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
                await deleteCart().unwrap();
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

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">

            {cartItems.length === 0 ? (
                <div className="text-gray-500 text-base">
                    Your cart is empty.
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-4">

                    <div className="lg:col-span-2 space-y-3">

                        {cartItems.map((cartItem) => (
                            <div
                                key={cartItem.id}
                                className="flex justify-between items-center bg-white shadow-sm rounded-lg p-4 text-sm"
                            >
                                <div className="flex-1">

                                    <h2 className="font-medium">
                                        {cartItem.item.itemName}
                                    </h2>

                                    <p className="text-gray-600">
                                        Rs. {cartItem.unitPrice?.toLocaleString()}
                                    </p>

                                    <p className="text-green-600 text-xs">
                                        Discount: Rs. {cartItem.discountSubTotal?.toLocaleString()}
                                    </p>

                                    <p className="text-gray-500 text-xs">
                                        Subtotal: Rs. {cartItem.subtotal?.toLocaleString()}
                                    </p>

                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() =>
                                                changeQuantity(cartItem, cartItem.cartQuantity - 1)
                                            }
                                            className="p-1 border rounded hover:bg-gray-100"
                                        >
                                            <Minus size={14} />
                                        </button>

                                        <span className="px-2">
                                            {cartItem.cartQuantity}
                                        </span>

                                        <button
                                            onClick={() =>
                                                changeQuantity(cartItem, cartItem.cartQuantity + 1)
                                            }
                                            className="p-1 border rounded hover:bg-gray-100"
                                        >
                                            <Plus size={14} />
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

                    <div className="bg-white shadow rounded-lg p-4 h-fit text-sm">

                        <div className="flex justify-between mb-2">
                            <span>Total Discount</span>
                            <span className="text-green-600">
                                Rs. {cart?.discountAmount?.toLocaleString() || 0}
                            </span>
                        </div>

                        <div className="flex justify-between mb-4">
                            <span>Total</span>
                            <span className="font-semibold">
                                Rs. {cart?.totalAmount?.toLocaleString() || 0}
                            </span>
                        </div>

                        <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                            Checkout
                        </button>

                        <button
                            onClick={clearCart}
                            className="w-full mt-2 border border-red-500 text-red-500 py-2 rounded-lg hover:bg-red-50 transition text-sm"
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