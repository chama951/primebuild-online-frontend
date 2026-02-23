import React from "react";

const ItemDetails = ({ item, onClose }) => {
    if (!item) return null;

    const featuresByType = React.useMemo(() => {
        const map = {};
        item.itemFeatureList.forEach(f => {
            const typeName = f.feature.featureType?.featureTypeName || "Other";
            if (!map[typeName]) map[typeName] = [];
            map[typeName].push({
                name: f.feature.featureName,
                slotCount: f.slotCount,
            });
        });
        return map;
    }, [item]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md relative shadow-lg overflow-y-auto max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl font-bold"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold mb-2">{item.itemName}</h2>

                <p className="mb-1">Price: LKR {item.price.toLocaleString()}</p>
                {item.discountPercentage > 0 && (
                    <p className="mb-1">Discount: {item.discountPercentage}%</p>
                )}

                {item.manufacturer && (
                    <div className="mb-2">
                        <p className="font-semibold">Manufacturer:</p>
                        <p>{item.manufacturer.manufacturerName}</p>
                    </div>
                )}

                {item.component && (
                    <div className="mb-2">
                        <p className="font-semibold">Component:</p>
                        <p>{item.component.componentName}</p>
                    </div>
                )}

                {Object.keys(featuresByType).length > 0 && (
                    <div className="mb-2">
                        {Object.entries(featuresByType).map(([typeName, featureList]) => (
                            <div key={typeName} className="mb-2">
                                <p className="font-medium">{typeName}:</p>
                                <ul className="list-disc ml-5">
                                    {featureList.map(f => (
                                        <li key={`${f.name}-${f.slotCount}`}>
                                            {f.name} {f.slotCount ? `(Slots: ${f.slotCount})` : ""}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemDetails;