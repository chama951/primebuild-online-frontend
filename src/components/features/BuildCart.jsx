import React, { useState, useMemo, useEffect } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import { useGetBuildComponentsQuery } from "../../features/components/componentApi.js";
import { useGetItemsByComponentIdQuery } from "../../features/components/itemApi.js";
import {
    useGetCompatibleItemsByComponentQuery,
    useGetCompatiblePowerSourcesQuery,
} from "../../features/components/compatibilityApi";
import {
    useCreateBuildMutation,
    useUpdateBuildMutation,
    useDeleteBuildMutation,
    useGetCurrentUserBuildsQuery,
} from "../../features/components/buildApi";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import { useCreateOrUpdateCartMutation, useGetCartQuery } from "../../features/components/cartApi.js";

const isPowerSourceComp = (comp) => comp?.powerSource === true;

const BuildCart = () => {
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemSearchTerm, setItemSearchTerm] = useState("");
    const [itemQuantities, setItemQuantities] = useState({});
    const [notification, setNotification] = useState({ show: false, type: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentBuildId, setCurrentBuildId] = useState(null);
    const [buildName, setBuildName] = useState("");

    const { data: components = [], isLoading: loadingComponents } = useGetBuildComponentsQuery(true, {
        refetchOnMountOrArgChange: true,
    });
    const { data: userBuilds = [], refetch: refetchUserBuilds } = useGetCurrentUserBuildsQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });

    const [createBuild] = useCreateBuildMutation();
    const [updateBuild] = useUpdateBuildMutation();
    const [deleteBuild] = useDeleteBuildMutation();
    const { data: cartData } = useGetCartQuery();
    const [updateCart] = useCreateOrUpdateCartMutation();

    const otherComponents = useMemo(() => components.filter((c) => !isPowerSourceComp(c)), [components]);
    const powerSourceComponents = useMemo(() => components.filter(isPowerSourceComp), [components]);

    const allOtherComponentsSelected = useMemo(
        () => otherComponents.every((comp) => selectedItems.some((item) => item.component?.id === comp.id)),
        [otherComponents, selectedItems]
    );

    const isPowerSourceEnabled = allOtherComponentsSelected && powerSourceComponents.length > 0;

    useEffect(() => {
        const build = userBuilds.find((b) => b.id === currentBuildId);
        if (build) {
            setBuildName(build.buildName);
            const mapped = build.buildItemList.map((bi) => ({
                ...bi.item,
                selectedQuantity: bi.item.component?.powerSource ? 1 : bi.buildQuantity,
                component: bi.item.component,
            }));
            setSelectedItems(mapped);
            // Preserve quantities
            const quantities = {};
            mapped.forEach((i) => (quantities[i.id] = i.selectedQuantity));
            setItemQuantities(quantities);
        } else {
            setBuildName("");
        }
    }, [currentBuildId, userBuilds]);

    const { data: allItems = [] } = useGetItemsByComponentIdQuery(selectedComponent?.id, { skip: !selectedComponent });

    const compatibilityParams =
        selectedComponent && selectedItems.length > 0
            ? { componentId: selectedComponent.id, selectedItems }
            : null;
    const { data: compatibleData = [] } = useGetCompatibleItemsByComponentQuery(compatibilityParams, {
        skip: !selectedComponent || selectedItems.length === 0 || isPowerSourceComp(selectedComponent),
    });

    const powerSourceParams = isPowerSourceEnabled && selectedItems.length > 0
        ? { componentId: powerSourceComponents[0]?.id, selectedItems }
        : null;
    const { data: compatiblePowerSources = [] } = useGetCompatiblePowerSourcesQuery(powerSourceParams, {
        skip: !isPowerSourceEnabled,
    });

    const itemsToShow = useMemo(() => {
        if (!selectedComponent) return [];
        if (isPowerSourceComp(selectedComponent)) return compatiblePowerSources;
        return selectedItems.length > 0
            ? Array.isArray(compatibleData)
                ? compatibleData
                : compatibleData?.data || []
            : allItems;
    }, [selectedComponent, selectedItems, compatibleData, allItems, compatiblePowerSources]);

    const filteredItems = useMemo(
        () => itemsToShow.filter((item) => (item.itemName || item.name || "").toLowerCase().includes(itemSearchTerm.toLowerCase())),
        [itemsToShow, itemSearchTerm]
    );

    const getItemName = (item) => item.itemName || item.name || "Item";
    const getItemPrice = (item) => item.price || 0;
    const getSelectedItem = (componentId) => selectedItems.find((item) => item.component?.id === componentId);

    const handleAddItem = (item, quantity) => {
        const maxSlots = item.quantity ?? 0;
        if (!isPowerSourceComp(item) && quantity > maxSlots) {
            setNotification({ show: true, type: "error", message: `Only ${maxSlots} items available in slots` });
            return;
        }
        const newItem = { ...item, selectedQuantity: isPowerSourceComp(item) ? 1 : quantity, component: item.component || selectedComponent };
        setSelectedItems((prev) => [...prev.filter((s) => s.component?.id !== newItem.component?.id), newItem]);
        setItemQuantities((prev) => ({ ...prev, [item.id]: newItem.selectedQuantity }));
    };

    const handleRemoveItem = (componentId) => setSelectedItems((prev) => prev.filter((item) => item.component?.id !== componentId));
    const handleClearItems = () => {
        setSelectedItems([]);
        setItemQuantities({});
    };

    const handleSaveBuild = async () => {
        if (!buildName.trim()) return setNotification({ show: true, type: "error", message: "Enter build name" });
        if (selectedItems.length === 0) return setNotification({ show: true, type: "error", message: "Select at least one item" });

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
            setNotification({ show: true, type: "error", message: err?.data?.message || "Failed to save build" });
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
            setItemQuantities({});
            refetchUserBuilds();
        } catch (err) {
            setNotification({ show: true, type: "error", message: err?.data?.message || "Failed to delete build" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddToCart = async () => {
        if (selectedItems.length === 0) {
            setNotification({ show: true, type: "error", message: "Select at least one item to add to cart" });
            return;
        }
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
            setNotification({ show: true, type: "error", message: err?.data?.message || "Failed to add items to cart" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPrice = selectedItems.reduce((sum, item) => sum + getItemPrice(item) * (item.selectedQuantity || 1), 0);

    if (loadingComponents) return <div className="p-6">Loading...</div>;

    return (
        <div className="container mx-auto p-4 space-y-6">
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({ show: false, type: "", message: "" })}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({ show: false, type: "", message: "" })}
                errorMessage={notification.message}
                isActionLoading={isSubmitting}
            />

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Build Management Row */}
                    <div className="bg-white rounded-lg border p-4 flex gap-3 items-center">
                        <input
                            type="text"
                            placeholder="Build name"
                            value={buildName}
                            onChange={(e) => setBuildName(e.target.value)}
                            className="flex-1 h-10 px-3 border rounded text-sm font-medium"
                        />
                        <select
                            value={currentBuildId || ""}
                            onChange={(e) => setCurrentBuildId(Number(e.target.value) || null)}
                            className="h-10 w-56 px-3 border rounded text-sm font-medium"
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
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                        >
                            Save
                        </button>
                        {currentBuildId && (
                            <button
                                onClick={handleDeleteBuild}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                            >
                                Delete
                            </button>
                        )}
                    </div>

                    {/* Components List */}
                    {components.map((comp) => {
                        const selectedItem = getSelectedItem(comp.id);
                        const disabled = isPowerSourceComp(comp) && !isPowerSourceEnabled;
                        return (
                            <div
                                key={comp.id}
                                className={`flex justify-between items-center bg-white shadow-sm rounded-lg p-4 font-medium cursor-pointer text-sm ${
                                    disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                                }`}
                                onClick={() => !disabled && setSelectedComponent(comp)}
                            >
                                <div className="flex-1">{comp.componentName}</div>
                                {selectedItem && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <span>{getItemName(selectedItem)}</span>
                                        <span className="text-green-700 font-medium">
                                            Rs {getItemPrice(selectedItem)} × {selectedItem.selectedQuantity}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveItem(comp.id);
                                            }}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Total & Add to Cart */}
                    <div className="bg-white rounded-lg border p-4 flex justify-between items-center text-sm font-medium">
                        <div className=" text-xl font-bold text-green-600">Rs {totalPrice.toFixed(2)}</div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleClearItems}
                                className="border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-50 text-sm font-medium"
                            >
                                Clear Items
                            </button>
                            <button
                                onClick={handleAddToCart}
                                disabled={isSubmitting}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                            >
                                {isSubmitting ? "Adding..." : "Add to Cart"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Item Selection */}
                <div className="space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto">
                    {selectedComponent ? (
                        <div className="bg-white rounded-lg border p-4 space-y-3">
                            <h3 className="font-medium text-sm">{selectedComponent.componentName}</h3>
                            <div className="space-y-2">
                                {filteredItems.map((item) => {
                                    const maxSlots = item.quantity ?? 0;
                                    const selectedQty =
                                        selectedItems.find((si) => si.id === item.id)?.selectedQuantity ||
                                        itemQuantities[item.id] ||
                                        1;
                                    return (
                                        <div
                                            key={item.id}
                                            className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm text-sm"
                                        >
                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="font-medium">{getItemName(item)}</div>
                                                <div className="text-gray-700 font-medium">Rs {getItemPrice(item)}</div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {!isPowerSourceComp(item) && (
                                                    <div className="flex items-center border rounded overflow-hidden">
                                                        <button
                                                            onClick={() =>
                                                                setItemQuantities((prev) => ({
                                                                    ...prev,
                                                                    [item.id]: Math.max(1, selectedQty - 1),
                                                                }))
                                                            }
                                                            className="px-2 py-1 hover:bg-gray-100"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="px-2">{selectedQty}</span>
                                                        <button
                                                            onClick={() =>
                                                                setItemQuantities((prev) => ({
                                                                    ...prev,
                                                                    [item.id]: Math.min(maxSlots, selectedQty + 1),
                                                                }))
                                                            }
                                                            className="px-2 py-1 hover:bg-gray-100"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                                <button
                                                    disabled={maxSlots === 0 || (isPowerSourceComp(item) && !isPowerSourceEnabled)}
                                                    onClick={() => handleAddItem(item, selectedQty)}
                                                    className="px-3 py-1 rounded text-white font-medium bg-blue-600 hover:bg-blue-700 text-sm"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500 text-center py-10 text-sm border rounded-lg bg-white">
                            Select a component
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuildCart;