import React, {useState, useMemo} from "react";
import {X, Plus, Minus} from "lucide-react";
import {
    useGetCompatibleItemsByComponentQuery,
    useGetCompatiblePowerSourcesQuery,
} from "../../services/compatibilityApi.js";
import {useGetItemsByComponentIdQuery} from "../../services/itemApi.js";

const SelectItems = ({open, onClose, component, selectedItems, onAddItem}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [itemQuantities, setItemQuantities] = useState({});

    const isPowerSource = component?.powerSource === true;

    const {data: allItems = []} = useGetItemsByComponentIdQuery(component?.id, {
        skip: !component || isPowerSource,
    });

    const compatibilityParams =
        component && selectedItems.length > 0
            ? {componentId: component.id, selectedItems}
            : null;

    const {data: compatibleItems = []} = useGetCompatibleItemsByComponentQuery(compatibilityParams, {
        skip: !component || selectedItems.length === 0 || isPowerSource,
    });

    const {data: compatiblePowerSources = []} = useGetCompatiblePowerSourcesQuery(compatibilityParams, {
        skip: !component || !isPowerSource,
    });

    const itemsToShow = useMemo(() => {
        if (!component) return [];
        if (isPowerSource) return compatiblePowerSources;
        return selectedItems.length > 0
            ? Array.isArray(compatibleItems)
                ? compatibleItems
                : compatibleItems?.data || []
            : allItems;
    }, [component, isPowerSource, selectedItems, compatibleItems, compatiblePowerSources, allItems]);

    const filteredItems = useMemo(
        () =>
            itemsToShow.filter((item) =>
                (item.itemName || "").toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [itemsToShow, searchTerm]
    );

    if (!open || !component) return null;

    const formatCurrency = (price) =>
        new Intl.NumberFormat("en-LK", {minimumFractionDigits: 2}).format(price);

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Select {component.componentName}</h2>
                    <button onClick={onClose}>
                        <X size={20}/>
                    </button>
                </div>

                {/* Search */}
                <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full mb-4 px-3 py-2 border rounded text-sm"
                />

                {/* Items */}
                <div className="space-y-3">
                    {filteredItems.map((item) => {
                        const maxSlots = item.quantity ?? 1;
                        const selectedQty = itemQuantities[item.id] || 1;
                        const features = item.itemFeatureList || []; // Show all features

                        return (
                            <div key={item.id} className="border rounded-lg p-3 hover:shadow-sm transition text-sm">
                                {/* Top Row */}
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-gray-800">{item.itemName}</div>
                                        <div
                                            className="text-xs text-gray-500">{item.manufacturer?.manufacturerName}</div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {features.map((f) => (
                                                <span key={f.id}
                                                      className="px-2 py-0.5 bg-gray-100 rounded text-[11px]">
                                                    {f.feature?.featureName}
                                                    {f.slotCount > 1 && ` x${f.slotCount}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right">
                                        <div
                                            className="text-green-700 font-semibold">Rs {formatCurrency(item.price)}</div>
                                    </div>
                                </div>

                                {/* Bottom Row */}
                                <div className="flex justify-between items-center mt-3">
                                    {!isPowerSource && (
                                        <div className="flex items-center border rounded">
                                            <button
                                                onClick={() =>
                                                    setItemQuantities((prev) => ({
                                                        ...prev,
                                                        [item.id]: Math.max(1, selectedQty - 1),
                                                    }))
                                                }
                                                className="px-2"
                                            >
                                                <Minus size={14}/>
                                            </button>
                                            <span className="px-3">{selectedQty}</span>
                                            <button
                                                onClick={() =>
                                                    setItemQuantities((prev) => ({
                                                        ...prev,
                                                        [item.id]: Math.min(maxSlots, selectedQty + 1),
                                                    }))
                                                }
                                                className="px-2"
                                            >
                                                <Plus size={14}/>
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        disabled={maxSlots === 0}
                                        onClick={() => {
                                            onAddItem(item, selectedQty);
                                            onClose();
                                        }}
                                        className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {filteredItems.length === 0 && (
                        <div className="text-gray-500 text-sm text-center py-6">No compatible items found</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SelectItems;