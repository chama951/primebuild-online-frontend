import React, {useState, useMemo} from "react";
import {useGetComponentsQuery} from "../../services/componentApi.js";
import {useGetFeatureTypesQuery} from "../../services/featureTypeApi.js";
import {
    useGetPaginatedItemsQuery,
    useGetPaginatedItemsByFeatureIdQuery,
    useGetPaginatedItemsByManufacturerIdQuery
} from "../../services/itemApi.js";
import {useGetCartQuery, useCreateOrUpdateCartMutation} from "../../services/cartApi.js";
import {useGetManufacturersQuery} from "../../services/manufacturerApi.js";
import ItemDetails from "./ItemDetails.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";

const Categories = () => {
    const {data: components = []} = useGetComponentsQuery();
    const {data: featureTypes = []} = useGetFeatureTypesQuery();
    const {data: manufacturers = []} = useGetManufacturersQuery();
    const {data: cartData} = useGetCartQuery();
    const [updateCart] = useCreateOrUpdateCartMutation();

    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [selectedManufacturer, setSelectedManufacturer] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 12;

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [showErrorDialog, setShowErrorDialog] = useState(false);

    const featureQuery = useGetPaginatedItemsByFeatureIdQuery(
        {featureId: selectedFeature, page: currentPage, size: itemsPerPage},
        {skip: !selectedFeature}
    );

    const manufacturerQuery = useGetPaginatedItemsByManufacturerIdQuery(
        {manufacturerId: selectedManufacturer, page: currentPage, size: itemsPerPage},
        {skip: !selectedManufacturer}
    );

    const defaultQuery = useGetPaginatedItemsQuery(
        {componentId: selectedComponent, page: currentPage, size: itemsPerPage},
        {skip: selectedFeature || selectedManufacturer}
    );

    const itemPage = selectedFeature
        ? featureQuery.data
        : selectedManufacturer
            ? manufacturerQuery.data
            : defaultQuery.data;

    const items = itemPage?.content || [];
    const totalPages = itemPage?.totalPages || 1;
    const totalItems = itemPage?.totalElements || 0;

    const start = currentPage * itemsPerPage + 1;
    const end = start + items.length - 1;

    const isLoading = featureQuery.isLoading || manufacturerQuery.isLoading || defaultQuery.isLoading;
    const isError = featureQuery.isError || manufacturerQuery.isError || defaultQuery.isError;

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

    const featureTypesById = useMemo(() => {
        const map = {};
        featureTypes.forEach(ft => map[ft.id] = ft.featureTypeName);
        return map;
    }, [featureTypes]);

    const featuresByType = useMemo(() => {
        const map = {};
        items.forEach(item => {
            item.itemFeatureList.forEach(f => {
                const typeName = featureTypesById[f.feature.featureType?.id] || "Other";
                if (!map[typeName]) map[typeName] = new Set();
                map[typeName].add(f.feature.featureName);
            });
        });
        Object.keys(map).forEach(k => map[k] = Array.from(map[k]));
        return map;
    }, [items, featureTypesById]);

    const toggleFeature = (typeName, feature) => {
        const featureId = feature.id || feature;
        if (selectedFeature === featureId) setSelectedFeature(null);
        else setSelectedFeature(featureId);

        setSelectedManufacturer(null);
        setSelectedComponent(null);
        setCurrentPage(0);
    };

    const toggleManufacturer = (manufacturerId) => {
        if (selectedManufacturer === manufacturerId) setSelectedManufacturer(null);
        else setSelectedManufacturer(manufacturerId);

        setSelectedFeature(null);
        setSelectedComponent(null);
        setCurrentPage(0);
    };

    const clearFilters = () => {
        setSelectedFeature(null);
        setSelectedManufacturer(null);
        setSelectedComponent(null);
        setCurrentPage(0);
    };

    if (isLoading) return <div className="py-4 text-gray-500">Loading...</div>;
    if (isError) return <div className="py-4 text-red-500">Failed to load items</div>;

    return (
        <div className="flex gap-6 px-4 py-4">

            <div
                className="w-64 border-r pr-4 flex flex-col gap-3 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">

                <h4 className="font-semibold">Components</h4>

                <button
                    onClick={clearFilters}
                    className={`border rounded p-2 text-left hover:bg-blue-50 transition ${!selectedComponent ? "bg-blue-600 text-white font-semibold" : ""}`}
                >
                    All
                </button>

                {components.map(c => (
                    <button
                        key={c.id}
                        onClick={() => {
                            setSelectedComponent(c.id);
                            setSelectedFeature(null);
                            setSelectedManufacturer(null);
                            setCurrentPage(0);
                        }}
                        className={`border rounded p-2 text-left hover:bg-blue-50 transition ${selectedComponent === c.id ? "bg-blue-600 text-white font-semibold" : ""}`}
                    >
                        {c.componentName}
                    </button>
                ))}

                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Features</h4>

                    {featureTypes.map(ft => (
                        <div key={ft.id} className="mb-2">

                            <p className="text-sm font-medium">{ft.featureTypeName}</p>

                            {ft.featureList?.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => toggleFeature(ft.featureTypeName, f)}
                                    className={`block w-full text-left px-2 py-1 border rounded mt-1 text-sm transition ${selectedFeature === f.id ? "bg-green-600 text-white" : "hover:bg-green-50"}`}
                                >
                                    {f.featureName}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="mt-4">
                    <h4 className="font-semibold mb-2">Manufacturer</h4>

                    {manufacturers.map(m => (
                        <button
                            key={m.id}
                            onClick={() => toggleManufacturer(m.id)}
                            className={`block w-full text-left px-2 py-1 border rounded mt-1 text-sm transition ${selectedManufacturer === m.id ? "bg-blue-600 text-white" : "hover:bg-blue-50"}`}
                        >
                            {m.manufacturerName}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1">

                <div className="mb-4 text-sm text-gray-600">
                    Showing {items.length > 0 ? `${start}-${end}` : 0} of {totalItems} items
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                    {items.length > 0 ? items.map(item => {

                        const discountedPrice = item.price * (1 - (item.discountPercentage || 0) / 100);

                        return (
                            <div
                                key={item.id}
                                className="border rounded-lg p-3 shadow hover:shadow-md bg-white cursor-pointer flex flex-col justify-between"
                                onClick={() => setSelectedItem(item)}
                            >

                                <h3 className="font-semibold text-sm line-clamp-2">{item.itemName}</h3>

                                <div>

                                    {item.discountPercentage > 0 ? (
                                        <>
                                            <p className="text-xs line-through text-gray-400">
                                                LKR {item.price.toLocaleString()}
                                            </p>

                                            <p className="text-green-600 font-semibold text-sm">
                                                LKR {discountedPrice.toLocaleString()}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-700">
                                            LKR {item.price.toLocaleString()}
                                        </p>
                                    )}

                                    {item.itemFeatureList?.length > 0 && (
                                        <p className="text-xs text-gray-500">
                                            {item.itemFeatureList.map(f => f.feature.featureName).join(", ")}
                                        </p>
                                    )}

                                    {item.manufacturer && (
                                        <p className="text-xs text-gray-500">
                                            {item.manufacturer.manufacturerName}
                                        </p>
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

                    }) : (
                        <div className="col-span-full text-gray-500">
                            No items found
                        </div>
                    )}

                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">

                        <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
                            disabled={currentPage === 0}
                            className="border px-3 py-1 rounded"
                        >
                            Prev
                        </button>

                        {(() => {

                            const maxPagesToShow = 5;

                            let start = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 0);
                            let end = start + maxPagesToShow - 1;

                            if (end >= totalPages) {
                                end = totalPages - 1;
                                start = Math.max(end - maxPagesToShow + 1, 0);
                            }

                            const pages = [];

                            for (let i = start; i <= end; i++) pages.push(i);

                            return pages.map(i => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`border px-3 py-1 rounded ${currentPage === i ? "bg-blue-600 text-white" : ""}`}
                                >
                                    {i + 1}
                                </button>
                            ));

                        })()}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))}
                            disabled={currentPage === totalPages - 1}
                            className="border px-3 py-1 rounded"
                        >
                            Next
                        </button>

                    </div>
                )}

            </div>

            {selectedItem && (
                <ItemDetails
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}

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

export default Categories;