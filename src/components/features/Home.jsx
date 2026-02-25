import {useState, useRef, useEffect} from "react";
import {ShoppingCart} from "lucide-react";

import Categories from "./Categories.jsx";
import PSUCalc from "./PSUCalc.jsx";
import TrendingProducts from "./TrendingProducts.jsx";
import BuildCart from "./BuildCart.jsx";
import Cart from "./Cart.jsx";
import Builds from "./Builds.jsx";
import Footer from "./Footer.jsx";
import PrimeBuildPriceTrends from "./PrimeBuildPriceTrends.jsx";
import {useGetCartQuery} from "../../features/components/cartApi.js";

const tabs = [
    {id: "categories", label: "Categories"},
    {id: "power", label: "PSU Calculator"},
    {id: "trending", label: "Trending Products"},
    {id: "build", label: "Build Your PC"},
    {id: "prebuilds", label: "Builds"},
    {id: "priceCharts", label: "Price Charts"},
];

const Home = () => {
    const [activeTab, setActiveTab] = useState("categories");
    const [showMiniCart, setShowMiniCart] = useState(false);
    const cartRef = useRef(null);

    const {data: cartData} = useGetCartQuery();
    const cartItems = cartData?.cartItemList || [];
    const cartCount = cartItems.reduce((sum, i) => sum + i.cartQuantity, 0);
    const totalAmount = cartData?.totalAmount || 0;
    const totalDiscount = cartData?.discountAmount || 0;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (cartRef.current && !cartRef.current.contains(event.target)) {
                setShowMiniCart(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const renderSection = () => {
        switch (activeTab) {
            case "categories":
                return <Categories/>;
            case "power":
                return <PSUCalc/>;
            case "trending":
                return <TrendingProducts/>;
            case "build":
                return <BuildCart/>;
            case "prebuilds":
                return <Builds/>;
            case "cart":
                return <Cart/>;
            case "priceCharts":
                return <PrimeBuildPriceTrends/>;
            default:
                return <Categories/>;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Tabs */}
                    <div className="flex gap-2 flex-wrap">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-2 text-sm font-semibold rounded-full transition ${
                                    activeTab === tab.id
                                        ? "bg-blue-500 text-white shadow"
                                        : "bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Mini Cart */}
                    <div className="relative" ref={cartRef}>
                        <button
                            onClick={() => setShowMiniCart(!showMiniCart)}
                            className="relative p-2 rounded-full hover:bg-gray-100"
                        >
                            <ShoppingCart className="w-6 h-6 text-gray-700"/>
                            {cartCount > 0 && (
                                <span
                                    className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
                            )}
                        </button>

                        {showMiniCart && cartItems.length > 0 && (
                            <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border z-50">
                                <div className="p-2 border-b font-semibold text-gray-700">Cart Items</div>
                                <div className="max-h-64 overflow-y-auto">
                                    {cartItems.map(item => (
                                        <div key={item.id} className="flex flex-col p-2 border-b text-sm">
                                            <div className="flex justify-between">
                                                <p className="font-medium">{item.item.itemName}</p>
                                                <div className="font-medium">
                                                    Rs. {(item.cartQuantity * item.unitPrice - (item.discountSubTotal || 0))?.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-gray-500 text-xs mt-1">
                                                <span>Qty: {item.cartQuantity} × Rs. {item.unitPrice?.toLocaleString()}</span>
                                                <span>Discount: Rs. {(item.discountSubTotal || 0)?.toLocaleString()}</span>
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
                                        <span>Total Amount:</span>
                                        <span>Rs. {totalAmount?.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="p-2 flex gap-2">
                                    <button
                                        onClick={() => setActiveTab("cart")}
                                        className="flex-1 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                    >
                                        Go to Cart
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
                {renderSection()}
            </main>

            <Footer/>
        </div>
    );
};

export default Home;