import React, { useState, useMemo } from "react";
import { useCreateOrUpdateCartMutation, useGetCartQuery } from "../../features/components/cartApi";

const BuildDetails = ({ build, onClose }) => {
    const { data: cartData } = useGetCartQuery();
    const [updateCart] = useCreateOrUpdateCartMutation();
    const [showMessage, setShowMessage] = useState("");

    if (!build) return null;

    const featuresByType = useMemo(() => {
        const map = {};
        build.buildItemList.forEach((bItem) => {
            const item = bItem.item;
            item.itemFeatureList.forEach((f) => {
                const typeName = f.feature.featureType?.featureTypeName || "Other";
                if (!map[typeName]) map[typeName] = [];
                map[typeName].push({
                    itemId: item.id,
                    itemName: item.itemName,
                    featureName: f.feature.featureName,
                    slotCount: f.slotCount,
                });
            });
        });
        return map;
    }, [build]);

    const handleAddItemToCart = async (item, quantity) => {
        try {
            const existingItems = cartData?.cartItemList || [];
            const updatedItemList = existingItems.map((ci) => ({ id: ci.item.id, quantity: ci.cartQuantity }));

            const index = updatedItemList.findIndex((ci) => ci.id === item.id);
            if (index !== -1) updatedItemList[index].quantity += quantity;
            else updatedItemList.push({ id: item.id, quantity });

            await updateCart({ itemList: updatedItemList }).unwrap();
            setShowMessage(`Added "${item.itemName}" to cart`);
            setTimeout(() => setShowMessage(""), 3000);
        } catch (err) {
            setShowMessage("Failed to add item to cart");
            setTimeout(() => setShowMessage(""), 3000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-12 overflow-auto">
            <div className="bg-white rounded-lg shadow-md max-w-5xl w-full p-6 relative">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 font-bold text-2xl"
                >
                    ×
                </button>

                <h2 className="text-2xl font-semibold mb-2 text-gray-800">{build.buildName}</h2>
                <p className="text-gray-500 mb-4 text-sm">
                    Created by: <span className="font-medium text-gray-700">{build.user.username}</span> | Created:{" "}
                    <span className="font-medium text-gray-700">{new Date(build.createdAt).toLocaleDateString()}</span>
                </p>
                <p className="text-gray-800 mb-4 font-semibold">
                    Total Price: <span className="text-green-600">LKR {build.totalPrice.toLocaleString()}</span>
                </p>

                {showMessage && (
                    <div className="mb-4 px-4 py-2 bg-green-100 text-green-800 rounded">{showMessage}</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {build.buildItemList.map((bItem, idx) => {
                        const item = bItem.item;
                        const discountedPrice = item.price * (1 - item.discountPercentage / 100);

                        const itemFeaturesByType = {};
                        item.itemFeatureList.forEach((f) => {
                            const typeName = f.feature.featureType?.featureTypeName || "Other";
                            if (!itemFeaturesByType[typeName]) itemFeaturesByType[typeName] = [];
                            itemFeaturesByType[typeName].push({
                                name: f.feature.featureName,
                                slotCount: f.slotCount,
                            });
                        });

                        return (
                            <div
                                key={idx}
                                className="border border-gray-200 rounded p-4 shadow-sm hover:shadow transition flex flex-col justify-between bg-white"
                            >
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    {item.component?.componentName || "N/A"}
                                </div>

                                <h3 className="font-semibold text-base text-gray-800 mb-1 truncate">{item.itemName}</h3>

                                <p className="text-gray-500 text-sm mb-1">
                                    Manufacturer: <span className="font-medium text-gray-700">{item.manufacturer?.manufacturerName}</span>
                                </p>

                                {Object.keys(itemFeaturesByType).length > 0 && (
                                    <div className="mb-2">
                                        {Object.entries(itemFeaturesByType).map(([typeName, featureList]) => (
                                            <div key={typeName} className="mb-1">
                                                <p className="font-medium text-gray-600">{typeName}:</p>
                                                <ul className="list-disc ml-5 text-gray-500 text-xs">
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

                                {/* Price */}
                                <p className="text-gray-800 font-medium text-sm mb-1">
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

                                <p className="text-gray-500 text-sm mt-1 mb-2">
                                    Quantity in Build: <span className="font-medium text-gray-700">{bItem.buildQuantity}</span>
                                </p>

                                <button
                                    onClick={() => handleAddItemToCart(item, bItem.buildQuantity)}
                                    className="mt-auto py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BuildDetails;