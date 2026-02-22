import { useState } from "react";
import { ShoppingCart } from "lucide-react";

import Categories from "./Categories.jsx";
import Power from "./Power.jsx";
import TrendingProducts from "./TrendingProducts.jsx";
import BuildCart from "./BuildCart.jsx";
import Cart from "./Cart.jsx";
import Footer from "./Footer.jsx";

const tabs = [
    { id: "categories", label: "Categories" },
    { id: "power", label: "Power Solutions" },
    { id: "trending", label: "Trending Products" },
    { id: "build", label: "Build Your PC" },
    { id: "cart", label: "Cart" }
];

const Home = () => {
    const [activeTab, setActiveTab] = useState("categories");
    const cartCount = 3; // Replace later with real cart state

    const renderSection = () => {
        switch (activeTab) {
            case "categories":
                return <Categories />;
            case "power":
                return <Power />;
            case "trending":
                return <TrendingProducts />;
            case "build":
                return <BuildCart />;
            case "cart":
                return <Cart />;
            default:
                return <Categories />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">

            {/* Top Navigation */}
            <div className="bg-white border-b shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 relative">

                    {/* Cart Icon (Right Corner) */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <button
                            onClick={() => setActiveTab("cart")}
                            className="relative p-2 rounded-full hover:bg-gray-100 transition"
                        >
                            <ShoppingCart className="w-6 h-6 text-gray-700" />

                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center gap-4 py-3 flex-wrap">
                        {tabs
                            .filter(tab => tab.id !== "cart") // hide cart from main tab list
                            .map((tab) => {
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative px-6 py-2 text-sm font-medium rounded-full transition-all duration-300
                                            ${
                                            isActive
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
                </div>
            </div>

            {/* Content */}
            <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-10 transition-all duration-300">
                {renderSection()}
            </main>

            <Footer />
        </div>
    );
};

export default Home;