import { useState } from "react";
import { ShoppingCart } from "lucide-react";

import Categories from "./Categories.jsx";
import PSUCalc from "./PSUCalc.jsx";
import TrendingProducts from "./TrendingProducts.jsx";
import BuildCart from "./BuildCart.jsx";
import Cart from "./Cart.jsx";
import Footer from "./Footer.jsx";

import { useGetCartQuery } from "../../features/components/cartApi.js";
import Builds from "./Builds.jsx";

const tabs = [
    { id: "categories", label: "Categories" },
    { id: "power", label: "PSU Calculator " },
    { id: "trending", label: "Trending Products" },
    { id: "build", label: "Build Your PC" },
    { id: "prebuilds", label: "Builds" },
    { id: "cart", label: "Cart" }
];

const Home = () => {
    const [activeTab, setActiveTab] = useState("categories");
    const [showMiniCart, setShowMiniCart] = useState(false);

    const { data: cartData, isLoading } = useGetCartQuery();
    const cartItems = cartData?.cartItemList || [];
    const cartCount = cartItems.reduce((sum, item) => sum + item.cartQuantity, 0);
    const totalAmount = cartData?.totalAmount || 0;
    const totalDiscount = cartData?.discountAmount || 0;

    const renderSection = () => {
        switch (activeTab) {
            case "categories":
                return <Categories />;
            case "power":
                return <PSUCalc />;
            case "trending":
                return <TrendingProducts />;
            case "build":
                return <BuildCart />;
            case "prebuilds":
                return <Builds />;
            case "cart":
                return <Cart />;
            default:
                return <Categories />;
        }
    };

    const toggleMiniCart = () => setShowMiniCart(!showMiniCart);

    const goToCart = () => {
        setActiveTab("cart");
        setShowMiniCart(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">

            <div className="bg-white border-b shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 relative flex items-center justify-between py-3">

                    <div className="flex gap-4 flex-wrap">
                        {tabs
                            .filter(tab => tab.id !== "cart") // hide cart from main tab list
                            .map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative px-6 py-2 text-sm font-medium rounded-full transition-all duration-300
                                            ${isActive
                                            ? "bg-blue-100 text-blue-700 font-semibold shadow-sm"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                                        }`}
                                    >
                                        {tab.label}
                                        {isActive && (
                                            <span className="absolute left-4 right-4 bottom-0 h-0.5 bg-blue-600 rounded-full"></span>
                                        )}
                                    </button>
                                );
                            })}
                    </div>

                    <div className="relative">
                        <button
                            onClick={toggleMiniCart}
                            className="relative p-2 rounded-full hover:bg-gray-100 transition"
                        >
                            <ShoppingCart className="w-6 h-6 text-gray-700" />
                            {!isLoading && cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {showMiniCart && cartItems.length > 0 && (
                            <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border z-50">
                                <div className="p-3 border-b font-semibold">Cart Items</div>

                                <div className="max-h-64 overflow-y-auto">
                                    {cartItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-2 border-b text-sm">
                                            <div>
                                                <p className="font-medium">{item.item.itemName}</p>
                                                <p className="text-gray-500 text-xs">
                                                    Qty: {item.cartQuantity} x Rs. {item.unitPrice?.toLocaleString()}
                                                </p>
                                                <p className="text-green-600 text-xs">
                                                    Discount: Rs. {item.discountSubTotal?.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="font-medium">
                                                Rs. {(item.cartQuantity * item.unitPrice - item.discountSubTotal)?.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 border-t text-sm flex flex-col gap-1">
                                    <div className="flex justify-between font-medium">
                                        <span>Total Discount:</span>
                                        <span className="text-green-600">Rs. {totalDiscount?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>Total:</span>
                                        <span>Rs. {totalAmount?.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="p-3 flex gap-2">
                                    <button
                                        onClick={goToCart}
                                        className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                    >
                                        Go to Cart
                                    </button>
                                    <button
                                        className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                                    >
                                        Checkout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-10 transition-all duration-300">
                {renderSection()}
            </main>

            <Footer />
        </div>
    );
};

export default Home;