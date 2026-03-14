import React, {useState, useEffect} from "react";
import {
    useGetTrendingItemsQuery,
    useGetAnalyticsByAttributeQuery
} from "../../services/itemAnalyticsApi.js";
import {useGetCartQuery, useCreateOrUpdateCartMutation} from "../../services/cartApi.js";
import ItemDetails from "./ItemDetails.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import Unauthorized from "../common/Unauthorized.jsx";

const Attributes = ["trending", "views", "sales", "carts"];

const TrendingProducts = () => {
    const [selectedAttribute, setSelectedAttribute] = useState("trending");
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 12;
    const maxPagesToShow = 5;

    const [selectedItem, setSelectedItem] = useState(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const {data: cartData} = useGetCartQuery();
    const [updateCart] = useCreateOrUpdateCartMutation();

    const {data: pageData, isLoading, error} =
        selectedAttribute === "trending"
            ? useGetTrendingItemsQuery({page: currentPage, size: pageSize}, {refetchOnMountOrArgChange: true})
            : useGetAnalyticsByAttributeQuery(
                {attribute: selectedAttribute, page: currentPage, size: pageSize},
                {refetchOnMountOrArgChange: true}
            );

    useEffect(() => {
        setCurrentPage(0);
    }, [selectedAttribute]);

    if (error?.status === 401 || error?.status === 403) return <Unauthorized/>;

    const items = pageData?.content?.map(a => a.item || a) || [];
    const totalPages = pageData?.totalPages || 1;

    const getPageNumbers = () => {
        let start = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 0);
        let end = start + maxPagesToShow - 1;

        if (end >= totalPages) {
            end = totalPages - 1;
            start = Math.max(end - maxPagesToShow + 1, 0);
        }

        const pages = [];
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    const pageNumbers = getPageNumbers();

    const handleAddToCart = async (item) => {
        try {
            const existingItems = cartData?.cartItemList || [];
            const updatedItems = existingItems.map(ci => ({id: ci.item.id, quantity: ci.cartQuantity}));
            const index = updatedItems.findIndex(i => i.id === item.id);
            if (index !== -1) updatedItems[index].quantity += 1;
            else updatedItems.push({id: item.id, quantity: 1});
            await updateCart({itemList: updatedItems}).unwrap();
            setSuccessMessage(`Added ${item.itemName} to cart`);
            setShowSuccessDialog(true);
        } catch (err) {
            setErrorMessage(err?.data?.message || "Failed to add to cart");
            setShowErrorDialog(true);
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex gap-2">
                {Attributes.map(attr => (
                    <button
                        key={attr}
                        onClick={() => setSelectedAttribute(attr)}
                        className={`px-3 py-2 rounded-lg border transition ${
                            selectedAttribute === attr
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white border-gray-300 hover:bg-blue-50"
                        }`}
                    >
                        {attr.charAt(0).toUpperCase() + attr.slice(1)}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="text-gray-500 py-4">Loading items...</div>
            ) : items.length === 0 ? (
                <div className="text-gray-500 py-4">No items available.</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map(item => {
                            const hasPrice = item.price != null;
                            const discountedPrice = hasPrice ? item.price * (1 - (item.discountPercentage || 0) / 100) : null;

                            return (
                                <div
                                    key={item.id}
                                    className="border rounded-lg p-3 shadow hover:shadow-md bg-white cursor-pointer flex flex-col justify-between"
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <h3 className="font-semibold text-sm line-clamp-2">{item.itemName}</h3>

                                    <div>
                                        {hasPrice ? (
                                            item.discountPercentage > 0 ? (
                                                <>
                                                    <p className="text-xs line-through text-gray-400">
                                                        LKR {item.price.toLocaleString()}
                                                    </p>
                                                    <p className="text-green-600 font-semibold text-sm">
                                                        LKR {discountedPrice.toLocaleString()}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-sm text-gray-700">LKR {item.price.toLocaleString()}</p>
                                            )
                                        ) : (
                                            <p className="text-sm text-gray-500">Price not available</p>
                                        )}

                                        {item.itemFeatureList?.length > 0 && (
                                            <p className="text-xs text-gray-500">
                                                {item.itemFeatureList.map(f => f.feature.featureName).join(", ")}
                                            </p>
                                        )}

                                        {item.manufacturer && (
                                            <p className="text-xs text-gray-500">{item.manufacturer.manufacturerName}</p>
                                        )}

                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleAddToCart(item);
                                            }}
                                            className="mt-2 w-full bg-blue-600 text-white rounded py-1 hover:bg-blue-700 text-sm"
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                                disabled={currentPage === 0}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Prev
                            </button>

                            {pageNumbers.map(i => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`px-3 py-1 border rounded ${currentPage === i ? "bg-blue-600 text-white" : ""}`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                                disabled={currentPage === totalPages - 1}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {selectedItem && <ItemDetails item={selectedItem} onClose={() => setSelectedItem(null)}/>}

            <NotificationDialogs
                showSuccessDialog={showSuccessDialog}
                setShowSuccessDialog={() => setShowSuccessDialog(false)}
                successMessage={successMessage}
                showErrorDialog={showErrorDialog}
                setShowErrorDialog={() => setShowErrorDialog(false)}
                errorMessage={errorMessage}
            />
        </div>
    );
};

export default TrendingProducts;