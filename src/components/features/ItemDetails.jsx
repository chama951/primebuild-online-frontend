import React from "react";

const ItemDetails = ({ item, onClose }) => {
    if (!item) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md relative shadow-lg">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                >
                    ✕
                </button>
                <h2 className="text-2xl font-bold mb-2">{item.itemName}</h2>
                <p className="mb-1">Price: LKR {item.price.toLocaleString()}</p>
                <p className="mb-1">Quantity: {item.quantity}</p>
                {item.discountPercentage > 0 && <p className="mb-1">Discount: {item.discountPercentage}%</p>}
                <p className="mb-1">Power: {item.powerConsumption}W</p>
                {item.manufacturer && <p className="mb-1">Manufacturer: {item.manufacturer.manufacturerName}</p>}
                {item.itemFeatureList.length > 0 && (
                    <p className="mb-1">Features: {item.itemFeatureList.map(f => f.feature.featureName).join(", ")}</p>
                )}
            </div>
        </div>
    );
};

export default ItemDetails;