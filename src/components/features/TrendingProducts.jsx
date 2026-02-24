import React, { useState, useMemo } from "react";
import { useGetComponentsQuery } from "../../features/components/componentApi.js";
import { useGetItemsQuery } from "../../features/components/itemApi.js";
import { useGetFeatureTypesQuery } from "../../features/components/featureTypeApi.js";
import { useGetCartQuery, useCreateOrUpdateCartMutation } from "../../features/components/cartApi.js";
import { useGetTrendingItemsQuery, useGetAnalyticsByAttributeQuery } from "../../features/components/itemAnalyticsApi.js";
import ItemDetails from "./ItemDetails.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";

const TrendingProducts = () => {
    const { data: components = [] } = useGetComponentsQuery();
    const { data: items = [] } = useGetItemsQuery();
    const { data: featureTypes = [] } = useGetFeatureTypesQuery();
    const { data: cartData } = useGetCartQuery();
    const [updateCart] = useCreateOrUpdateCartMutation();

    const [selectedAttribute, setSelectedAttribute] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedFeatures, setSelectedFeatures] = useState({});
    const [selectedManufacturer, setSelectedManufacturer] = useState("");
    const [sortOrder, setSortOrder] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const { data: trendingData = [] } = useGetTrendingItemsQuery();
    const { data: analyticsData = [] } = useGetAnalyticsByAttributeQuery(selectedAttribute, { skip: selectedAttribute === null });

    const featureTypesById = useMemo(() => {
        const map = {};
        featureTypes.forEach(ft => { map[ft.id] = ft.featureTypeName; });
        return map;
    }, [featureTypes]);

    const featuresByType = useMemo(() => {
        const sourceItems = selectedAttribute ? analyticsData.map(a => a.item) : trendingData.map(a => a.item);
        const map = {};
        sourceItems
            .filter(item => !selectedCategory || item.component?.id === selectedCategory)
            .forEach(item => {
                item.itemFeatureList.forEach(f => {
                    const typeName = featureTypesById[f.feature.featureType?.id] || "Other";
                    if (!map[typeName]) map[typeName] = new Set();
                    map[typeName].add(f.feature.featureName);
                });
            });
        Object.keys(map).forEach(k => map[k] = Array.from(map[k]));
        return map;
    }, [featureTypesById, selectedCategory, analyticsData, trendingData, selectedAttribute]);

    const manufacturers = useMemo(() => {
        const sourceItems = selectedAttribute ? analyticsData.map(a => a.item) : trendingData.map(a => a.item);
        const set = new Set();
        sourceItems
            .filter(item => !selectedCategory || item.component?.id === selectedCategory)
            .forEach(item => { if (item.manufacturer?.manufacturerName) set.add(item.manufacturer.manufacturerName); });
        return Array.from(set);
    }, [selectedCategory, analyticsData, trendingData, selectedAttribute]);

    const toggleFeature = (typeName, featureName) => {
        setSelectedFeatures(prev => {
            const newSelected = { ...prev };
            if (newSelected[typeName] === featureName) delete newSelected[typeName];
            else newSelected[typeName] = featureName;
            return newSelected;
        });
        setCurrentPage(1);
    };
    const toggleManufacturer = (name) => {
        setSelectedManufacturer(prev => (prev === name ? "" : name));
        setCurrentPage(1);
    };
    const clearFilters = () => {
        setSelectedFeatures({});
        setSelectedManufacturer("");
        setSortOrder("");
        setCurrentPage(1);
    };

    const handleAddToCart = async (item) => {
        try {
            const existingItems = cartData?.cartItemList || [];
            const updatedItemList = existingItems.map(ci => ({ id: ci.item.id, quantity: ci.cartQuantity }));
            const index = updatedItemList.findIndex(ci => ci.id === item.id);
            if (index !== -1) updatedItemList[index].quantity += 1;
            else updatedItemList.push({ id: item.id, quantity: 1 });
            await updateCart({ itemList: updatedItemList }).unwrap();
            setSuccessMessage(`Added ${item.itemName} to cart`);
            setShowSuccessDialog(true);
        } catch (err) {
            setErrorMessage(err?.data?.message || "Failed to add to cart");
            setShowErrorDialog(true);
        }
    };

    const filteredItems = useMemo(() => {
        const sourceItems = selectedAttribute ? analyticsData.map(a => a.item) : trendingData.map(a => a.item);
        let filtered = sourceItems;

        if (selectedCategory) filtered = filtered.filter(item => item.component?.id === selectedCategory);

        const selectedTypes = Object.keys(selectedFeatures);
        if (selectedTypes.length > 0) {
            filtered = filtered.filter(item =>
                selectedTypes.every(type =>
                    item.itemFeatureList.some(f =>
                        featureTypesById[f.feature.featureType?.id] === type &&
                        selectedFeatures[type] === f.feature.featureName
                    )
                )
            );
        }

        if (selectedManufacturer) filtered = filtered.filter(item => item.manufacturer?.manufacturerName === selectedManufacturer);

        if (sortOrder === "asc") filtered.sort((a, b) => a.price - b.price);
        if (sortOrder === "desc") filtered.sort((a, b) => b.price - a.price);

        return filtered;
    }, [analyticsData, trendingData, selectedAttribute, selectedCategory, selectedFeatures, selectedManufacturer, sortOrder, featureTypesById]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="max-w-7xl mx-auto px-4 py-4 flex gap-6">

            <div className="w-64 flex-shrink-0 border-r pr-4 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
                <div className="mb-4">
                    {["Trending", "Views", "Sales", "Carts"].map(attr => (
                        <button
                            key={attr}
                            onClick={() => { setSelectedAttribute(attr === "Trending" ? null : attr.toLowerCase()); setCurrentPage(1); clearFilters(); }}
                            className={`px-3 py-2 rounded-lg border text-left mb-2 w-full transition ${
                                (attr === "Trending" && !selectedAttribute) || selectedAttribute === attr.toLowerCase()
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                            }`}
                        >
                            {attr}
                        </button>
                    ))}
                </div>

                <h4 className="font-semibold mb-2">Components</h4>
                <div className="mb-4 flex flex-col gap-2">
                    <button
                        onClick={() => { setSelectedCategory(null); clearFilters(); }}
                        className={`px-3 py-2 rounded-lg border w-full transition ${selectedCategory === null ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300 hover:bg-blue-50"}`}
                    >
                        All
                    </button>
                    {components.map(component => (
                        <button
                            key={component.id}
                            onClick={() => { setSelectedCategory(component.id); setCurrentPage(1); }}
                            className={`px-3 py-2 rounded-lg border w-full transition ${selectedCategory === component.id ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300 hover:bg-blue-50"}`}
                        >
                            {component.componentName}
                        </button>
                    ))}
                </div>

                {Object.keys(featuresByType).length > 0 && (
                    <div className="mb-4">
                        {Object.entries(featuresByType).map(([typeName, featureArr]) => (
                            <div key={typeName} className="mb-3">
                                <h4 className="font-semibold mb-1">{typeName}</h4>
                                <div className="flex flex-col gap-1">
                                    {featureArr.map(feature => (
                                        <button
                                            key={feature}
                                            onClick={() => toggleFeature(typeName, feature)}
                                            className={`px-3 py-1 rounded-lg border text-left transition ${selectedFeatures[typeName] === feature ? "bg-green-600 text-white border-green-600" : "bg-white border-gray-300 hover:bg-green-50"}`}
                                        >
                                            {feature}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {manufacturers.length > 0 && (
                    <div className="mb-4">
                        <h4 className="font-semibold mb-1">Manufacturer</h4>
                        <div className="flex flex-col gap-1">
                            {manufacturers.map(man => (
                                <button
                                    key={man}
                                    onClick={() => toggleManufacturer(man)}
                                    className={`px-3 py-1 rounded-lg border text-left transition ${selectedManufacturer === man ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300 hover:bg-blue-50"}`}
                                >
                                    {man}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {(Object.keys(selectedFeatures).length > 0 || selectedManufacturer || sortOrder) && (
                    <button
                        onClick={clearFilters}
                        className="mt-2 px-3 py-1 rounded-lg border border-red-500 text-red-500 hover:bg-red-50 w-full"
                    >
                        Clear All Filters
                    </button>
                )}

                <div className="mt-4">
                    <label className="font-medium mb-1 block">Sort by price:</label>
                    <select
                        value={sortOrder}
                        onChange={e => setSortOrder(e.target.value)}
                        className="p-2 border rounded shadow-sm w-full"
                    >
                        <option value="">Default</option>
                        <option value="asc">Low → High</option>
                        <option value="desc">High → Low</option>
                    </select>
                </div>
            </div>

            <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {paginatedItems.length > 0 ? paginatedItems.map(item => {
                        const discountedPrice = item.price * (1 - item.discountPercentage / 100);
                        return (
                            <div
                                key={item.id}
                                className="border rounded-lg p-3 shadow hover:shadow-md transition flex flex-col justify-between h-108 bg-white cursor-pointer"
                                onClick={() => setSelectedItem(item)}
                            >
                                <div className="overflow-hidden">
                                    <h3 className="font-semibold text-md line-clamp-2">{item.itemName}</h3>
                                </div>
                                <div>Image</div>
                                <div className="flex flex-col justify-end mt-2">
                                    {item.discountPercentage > 0 ? (
                                        <div className="mb-1">
                                            <p className="text-sm text-gray-400 line-through">LKR {item.price.toLocaleString()}</p>
                                            <p className="text-sm text-green-600 font-semibold">LKR {discountedPrice.toLocaleString()}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-600 mb-1">Price: LKR {item.price.toLocaleString()}</p>
                                    )}
                                    {item.manufacturer && <p className="text-xs text-gray-500 mb-1">{item.manufacturer.manufacturerName}</p>}
                                    {item.itemFeatureList.length > 0 && (
                                        <p className="text-xs text-gray-500 mb-1">{item.itemFeatureList.map(f => f.feature.featureName).join(", ")}</p>
                                    )}
                                    <button
                                        onClick={e => { e.stopPropagation(); handleAddToCart(item); }}
                                        className="mt-1 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-gray-500 col-span-full py-4">No items match the selected filters.</div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50">Prev</button>
                        {[...Array(totalPages)].map((_, idx) => (
                            <button key={idx} onClick={() => setCurrentPage(idx + 1)} className={`px-3 py-1 border rounded ${currentPage === idx + 1 ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}>{idx + 1}</button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50">Next</button>
                    </div>
                )}
            </div>

            {selectedItem && <ItemDetails item={selectedItem} onClose={() => setSelectedItem(null)} />}

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