import { Trash2 } from "lucide-react";

const Cart = () => {
    // Temporary mock data (replace with Redux or API later)
    const cartItems = [
        { id: 1, name: "Gaming GPU RTX 4070", price: 85000, quantity: 1 },
        { id: 2, name: "750W Power Supply", price: 22000, quantity: 2 }
    ];

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {cartItems.length === 0 ? (
                <div className="text-gray-500 text-base">
                    Your cart is empty.
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-4">

                    {/* Items */}
                    <div className="lg:col-span-2 space-y-3">
                        {cartItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center bg-white shadow-sm rounded-lg p-3 text-sm"
                            >
                                <div>
                                    <h2 className="font-medium">{item.name}</h2>
                                    <p className="text-gray-600">Rs. {item.price.toLocaleString()}</p>
                                    <p className="text-gray-500">Qty: {item.quantity}</p>
                                </div>

                                <button className="text-red-500 hover:text-red-700">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="bg-white shadow rounded-lg p-4 h-fit text-sm">
                        <div className="flex justify-between mb-2">
                            <span>Total</span>
                            <span className="font-medium">
                                Rs. {total.toLocaleString()}
                            </span>
                        </div>

                        <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                            Checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;