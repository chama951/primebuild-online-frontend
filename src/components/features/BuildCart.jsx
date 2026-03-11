import React, { useState, useMemo, useEffect } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import { useGetBuildComponentsQuery } from "../../services/componentApi.js";
import {
    useCreateBuildMutation,
    useUpdateBuildMutation,
    useDeleteBuildMutation,
    useGetCurrentUserBuildsQuery,
} from "../../services/buildApi.js";
import { useCreateOrUpdateCartMutation, useGetCartQuery } from "../../services/cartApi.js";
import { useGetPaginatedItemsByComponentIdQuery } from "../../services/itemApi.js";
import { useGetCompatibleItemsByComponentQuery } from "../../services/compatibilityApi.js";
import NotificationDialogs from "../common/NotificationDialogs.jsx";

const ITEMS_PER_PAGE = 5;

const BuildCart = () => {
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [currentBuildId, setCurrentBuildId] = useState(null);
    const [buildName, setBuildName] = useState("");
    const [notification, setNotification] = useState({ show: false, type: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [itemQuantities, setItemQuantities] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [compatibleComponentId, setCompatibleComponentId] = useState(null);

    // Fetch components
    const { data: components = [], isLoading: loadingComponents } = useGetBuildComponentsQuery(true, {
        refetchOnMountOrArgChange: true,
    });

    // Set initial component
    useEffect(() => {
        if (!loadingComponents && components.length > 0 && !selectedComponent) {
            setSelectedComponent(components[0]);
            setCurrentPage(1);
        }
    }, [loadingComponents, components, selectedComponent]);

    // User builds
    const { data: userBuilds = [], refetch: refetchUserBuilds } = useGetCurrentUserBuildsQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const [createBuild] = useCreateBuildMutation();
    const [updateBuild] = useUpdateBuildMutation();
    const [deleteBuild] = useDeleteBuildMutation();

    // Cart
    const { data: cartData } = useGetCartQuery();
    const [updateCart] = useCreateOrUpdateCartMutation();

    // Load selected build
    useEffect(() => {
        if (!currentBuildId) {
            setBuildName("");
            setSelectedItems([]);
            return;
        }
        const build = userBuilds.find((b) => b.id === currentBuildId);
        if (build) {
            setBuildName(build.buildName);
            const mapped = build.buildItemList.map((bi) => ({
                ...bi.item,
                selectedQuantity: bi.buildQuantity,
                component: bi.item.component,
            }));
            setSelectedItems(mapped);
        } else {
            setBuildName("");
            setSelectedItems([]);
        }
    }, [currentBuildId, userBuilds]);

    // Handlers
    const handleAddItem = (item, quantity) => {
        const newItem = {
            ...item,
            selectedQuantity: quantity,
            component: item.component || selectedComponent,
        };
        setSelectedItems((prev) => [
            ...prev.filter((i) => i.component?.id !== newItem.component?.id),
            newItem,
        ]);
    };

    const handleRemoveItem = (componentId) =>
        setSelectedItems((prev) => prev.filter((item) => item.component?.id !== componentId));

    const handleClearItems = () => setSelectedItems([]);

    const handleSaveBuild = async () => {
        if (!buildName.trim())
            return setNotification({ show: true, type: "error", message: "Enter build name" });
        if (selectedItems.length === 0)
            return setNotification({ show: true, type: "error", message: "Select at least one item" });

        setIsSubmitting(true);
        const payload = {
            buildName: buildName.trim(),
            buildStatus: "DRAFT",
            itemList: selectedItems.map((i) => ({ id: i.id, quantity: i.selectedQuantity.toString() })),
        };

        try {
            if (currentBuildId) await updateBuild({ id: currentBuildId, ...payload }).unwrap();
            else {
                const res = await createBuild(payload).unwrap();
                setCurrentBuildId(res.id);
            }
            setNotification({ show: true, type: "success", message: "Build saved successfully!" });
            refetchUserBuilds();
        } catch (err) {
            setNotification({
                show: true,
                type: "error",
                message: err?.data?.message || "Failed to save build",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBuild = async () => {
        if (!currentBuildId) return;
        setIsSubmitting(true);
        try {
            await deleteBuild(currentBuildId).unwrap();
            setNotification({ show: true, type: "success", message: "Build deleted successfully!" });
            setCurrentBuildId(null);
            setBuildName("");
            setSelectedItems([]);
            refetchUserBuilds();
        } catch (err) {
            setNotification({
                show: true,
                type: "error",
                message: err?.data?.message || "Failed to delete build",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddToCart = async () => {
        if (selectedItems.length === 0)
            return setNotification({ show: true, type: "error", message: "Select at least one item" });

        setIsSubmitting(true);
        try {
            const existingItems = cartData?.cartItemList || [];
            const updatedItemList = existingItems.map((ci) => ({ id: ci.item.id, quantity: ci.cartQuantity }));
            selectedItems.forEach((item) => {
                const index = updatedItemList.findIndex((ci) => ci.id === item.id);
                if (index !== -1) updatedItemList[index].quantity += item.selectedQuantity;
                else updatedItemList.push({ id: item.id, quantity: item.selectedQuantity });
            });
            await updateCart({ itemList: updatedItemList }).unwrap();
            setNotification({ show: true, type: "success", message: "Added selected items to cart!" });
        } catch (err) {
            setNotification({
                show: true,
                type: "error",
                message: err?.data?.message || "Failed to add to cart",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Pricing
    const totalPrice = useMemo(
        () => selectedItems.reduce((sum, item) => sum + (item.price || 0) * (item.selectedQuantity || 1), 0),
        [selectedItems]
    );

    const formatCurrency = (price) =>
        new Intl.NumberFormat("en-LK", { minimumFractionDigits: 2 }).format(price);

    // Fetch items
    const { data: allItems = {} } = useGetPaginatedItemsByComponentIdQuery(
        { componentId: selectedComponent?.id, page: currentPage - 1, size: ITEMS_PER_PAGE },
        { skip: !selectedComponent }
    );

    const { data: compatibleItems = {} } = useGetCompatibleItemsByComponentQuery(
        compatibleComponentId
            ? {
                componentId: compatibleComponentId,
                // only send already selected items excluding current component
                selectedItems: selectedItems.filter((i) => i.component?.id !== compatibleComponentId),
                page: currentPage - 1,
                size: ITEMS_PER_PAGE,
            }
            : null,
        { skip: !compatibleComponentId } // skip query if no component selected
    );

    const itemsToShow = useMemo(() => {
        if (!selectedComponent) return [];
        if (compatibleComponentId === selectedComponent.id) {
            return Array.isArray(compatibleItems?.content) ? compatibleItems.content : [];
        }
        return Array.isArray(allItems?.content) ? allItems.content : [];
    }, [selectedComponent, allItems, compatibleItems, compatibleComponentId]);

    const totalPages =
        compatibleComponentId === selectedComponent?.id
            ? compatibleItems?.totalPages || 1
            : allItems?.totalPages || 1;

    const handleComponentClick = (comp) => {
        setSelectedComponent(comp);
        setCurrentPage(1);
        setCompatibleComponentId(selectedItems.length > 0 ? comp.id : null);
    };

    if (loadingComponents) return <div className="p-6">Loading...</div>;

    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* Notification */}
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({ show: false, type: "", message: "" })}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({ show: false, type: "", message: "" })}
                errorMessage={notification.message}
                isActionLoading={isSubmitting}
            />

            {/* Build name & selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row gap-3 items-center">
                <input
                    type="text"
                    placeholder="Build name"
                    value={buildName}
                    onChange={(e) => setBuildName(e.target.value)}
                    className="flex-1 h-12 px-4 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
                <select
                    value={currentBuildId || ""}
                    onChange={(e) => setCurrentBuildId(Number(e.target.value) || null)}
                    className="h-12 w-full md:w-56 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                >
                    <option value="">New Build</option>
                    {userBuilds.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.buildName}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleSaveBuild}
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save
                </button>
                {currentBuildId && (
                    <button
                        onClick={handleDeleteBuild}
                        disabled={isSubmitting}
                        className="w-full md:w-auto px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Delete
                    </button>
                )}
            </div>

            {/* Components & Items */}
            <div className="flex flex-col md:flex-row gap-6 md:h-[600px]">
                {/* Component list */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 flex flex-col h-full overflow-y-auto space-y-3 pr-2">
                    {components.map((comp) => {
                        const selectedItem = selectedItems.find((item) => item.component?.id === comp.id);
                        return (
                            <div
                                key={comp.id}
                                className="flex justify-between items-center bg-white shadow-sm rounded-lg p-4 cursor-pointer transition hover:shadow-md hover:bg-gray-50 border border-gray-300"
                                onClick={() => handleComponentClick(comp)}
                            >
                                <div className="flex-1 flex justify-between items-center gap-4">
                                    <div className="font-semibold text-gray-800">{comp.componentName}</div>
                                    {selectedItem && (
                                        <div className="text-sm text-gray-600 flex items-center gap-2">
                                            <span className="font-medium">{selectedItem.itemName}</span>
                                            <span className="text-green-600 font-semibold">
                                Rs {formatCurrency(selectedItem.price)} × {selectedItem.selectedQuantity}
                            </span>
                                        </div>
                                    )}
                                </div>
                                {selectedItem && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveItem(comp.id);
                                        }}
                                        className="text-red-500 hover:text-red-700 transition ml-4"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Item list */}
                {selectedComponent && (
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 flex flex-col h-full">
                        <h2 className="text-lg font-semibold mb-3">
                            Select {selectedComponent.componentName}
                        </h2>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {itemsToShow.map((item) => {
                                const maxSlots = item.quantity ?? 1;
                                const selectedQty = Math.min(itemQuantities[item.id] || 1, maxSlots);
                                const features = item.itemFeatureList || [];

                                return (
                                    <div key={item.id} className="border rounded-lg p-3 hover:shadow-sm transition text-sm">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="font-semibold text-gray-800">{item.itemName}</div>
                                                <div className="text-xs text-gray-500">{item.manufacturer?.manufacturerName}</div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {features.map((f) => (
                                                        <span key={f.id} className="px-2 py-0.5 bg-gray-100 rounded text-[11px]">
                                                            {f.feature?.featureName}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-right text-green-700 font-semibold">
                                                Rs {formatCurrency(item.price)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-3">
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
                                                    <Minus size={14} />
                                                </button>

                                                <span className="px-3 text-sm">{selectedQty}</span>

                                                <button
                                                    onClick={() =>
                                                        setItemQuantities((prev) => ({
                                                            ...prev,
                                                            [item.id]: Math.min(maxSlots, selectedQty + 1),
                                                        }))
                                                    }
                                                    className="px-2"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            <button
                                                disabled={maxSlots === 0}
                                                onClick={() => handleAddItem(item, selectedQty)}
                                                className="w-24 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {itemsToShow.length === 0 && (
                                <div className="text-gray-500 text-sm text-center py-6">
                                    No compatible items found
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-4 pt-3 border-t flex justify-center items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border rounded disabled:opacity-50"
                                >
                                    Prev
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 border rounded ${currentPage === page ? "bg-blue-600 text-white" : ""}`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Total & actions */}
            <div className="bg-white rounded-lg border p-4 flex justify-between items-center mt-4">
                <div className="text-xl font-bold text-green-600">Rs {formatCurrency(totalPrice)}</div>
                <div className="flex gap-2">
                    <button onClick={handleClearItems} className="border border-red-500 text-red-500 px-4 py-2 rounded">
                        Clear
                    </button>
                    <button onClick={handleAddToCart} className="bg-blue-600 text-white px-4 py-2 rounded">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BuildCart;