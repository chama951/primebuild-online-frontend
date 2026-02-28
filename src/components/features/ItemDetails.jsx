import React, { useState, useMemo, useEffect } from "react";
import { useGetCartQuery, useCreateOrUpdateCartMutation } from "../../services/cartApi.js";
import { useIncrementViewCountMutation } from "../../services/itemAnalyticsApi.js";
import NotificationDialogs from "../common/NotificationDialogs.jsx";

const ItemDetails = ({ item, onClose }) => {
    const { data: cartData } = useGetCartQuery();
    const [updateCart] = useCreateOrUpdateCartMutation();
    const [incrementViewCount] = useIncrementViewCountMutation();

    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        action: null,
    });

    useEffect(() => {
        if (item?.id) {
            incrementViewCount(item.id)
                .unwrap()
                .catch((err) => console.error("Failed to increment view:", err));
        }
    }, [item, incrementViewCount]);

    if (!item) return null;

    const featuresByType = useMemo(() => {
        const map = {};
        item.itemFeatureList.forEach((f) => {
            const typeName = f.feature.featureType?.featureTypeName || "Other";
            if (!map[typeName]) map[typeName] = [];
            map[typeName].push({ name: f.feature.featureName, slotCount: f.slotCount });
        });
        return map;
    }, [item]);

    const showNotification = (type, message) => {
        setNotification({ show: true, type, message, action: null });
    };

    const handleAddToCart = async () => {
        try {
            const existingItems = cartData?.cartItemList || [];
            const updatedItemList = existingItems.map((ci) => ({ id: ci.item.id, quantity: ci.cartQuantity }));

            const index = updatedItemList.findIndex((ci) => ci.id === item.id);
            if (index !== -1) updatedItemList[index].quantity += 1;
            else updatedItemList.push({ id: item.id, quantity: 1 });

            await updateCart({ itemList: updatedItemList }).unwrap();

            showNotification("success", `Added "${item.itemName}" to cart`);
            onClose();
        } catch (err) {
            console.error(err);
            showNotification("error", `Failed to add "${item.itemName}" to cart`);
        }
    };

    const discountedPrice = item.price * (1 - (item.discountPercentage || 0) / 100);

    return (
        <>

            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                errorMessage={notification.message}
            />

            {/* Modal */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-12 overflow-auto">
                <div className="bg-white rounded-lg shadow-md max-w-md w-full p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 font-bold text-2xl">×</button>

                    <h2 className="text-2xl font-semibold mb-2 text-gray-800">{item.itemName}</h2>

                    {item.manufacturer && (
                        <p className="text-gray-500 mb-2 text-sm">
                            Manufacturer: <span className="font-medium text-gray-700">{item.manufacturer.manufacturerName}</span>
                        </p>
                    )}

                    {item.component && (
                        <p className="text-gray-500 mb-2 text-sm">
                            Component: <span className="font-medium text-gray-700">{item.component.componentName}</span>
                        </p>
                    )}

                    {Object.keys(featuresByType).length > 0 && (
                        <div className="mb-4">
                            {Object.entries(featuresByType).map(([typeName, featureList]) => (
                                <div key={typeName} className="mb-2">
                                    <p className="font-medium text-gray-600">{typeName}:</p>
                                    <ul className="list-disc ml-5 text-gray-500 text-sm">
                                        {featureList.map((f) => (
                                            <li key={`${f.name}-${f.slotCount}`}>
                                                {f.name} {f.slotCount ? `(Slots: ${f.slotCount})` : ""}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-gray-800 font-medium text-sm mb-2">
                        Price:{" "}
                        {item.discountPercentage > 0 ? (
                            <>
                                <span className="line-through text-gray-400 text-sm">LKR {item.price.toLocaleString()}</span>{" "}
                                <span className="text-green-600 font-semibold">LKR {discountedPrice.toLocaleString()}</span>
                            </>
                        ) : (
                            <>LKR {item.price.toLocaleString()}</>
                        )}
                    </p>

                    <button
                        onClick={handleAddToCart}
                        className="mt-4 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </>
    );
};

export default ItemDetails;