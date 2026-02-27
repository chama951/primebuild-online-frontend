import React, {useState, useMemo, useEffect} from "react";
import {Trash2} from "lucide-react";
import {useGetBuildComponentsQuery} from "../../services/componentApi.js";
import {
    useCreateBuildMutation,
    useUpdateBuildMutation,
    useDeleteBuildMutation,
    useGetCurrentUserBuildsQuery,
} from "../../services/buildApi.js";
import {useCreateOrUpdateCartMutation, useGetCartQuery} from "../../services/cartApi.js";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import SelectItems from "./SelectItems.jsx";

const BuildCart = () => {
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [currentBuildId, setCurrentBuildId] = useState(null);
    const [buildName, setBuildName] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState({show: false, type: "", message: ""});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {data: components = [], isLoading: loadingComponents} =
        useGetBuildComponentsQuery(true, {refetchOnMountOrArgChange: true});

    const firstComponent = useMemo(() => components[0], [components]);

    useEffect(() => {
        if (!loadingComponents && firstComponent && !selectedComponent) {
            setSelectedComponent(firstComponent);
        }
    }, [loadingComponents, firstComponent]);

    const {data: userBuilds = [], refetch: refetchUserBuilds} =
        useGetCurrentUserBuildsQuery(undefined, {refetchOnMountOrArgChange: true});

    const [createBuild] = useCreateBuildMutation();
    const [updateBuild] = useUpdateBuildMutation();
    const [deleteBuild] = useDeleteBuildMutation();

    const {data: cartData} = useGetCartQuery();
    const [updateCart] = useCreateOrUpdateCartMutation();

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

    const handleAddItem = (item, quantity) => {
        const newItem = {
            ...item,
            selectedQuantity: item.powerSource ? 1 : quantity,
            component: item.component || selectedComponent,
        };
        setSelectedItems((prev) => [
            ...prev.filter((i) => i.component?.id !== newItem.component?.id),
            newItem,
        ]);
    };

    const handleRemoveItem = (componentId) => {
        setSelectedItems((prev) => prev.filter((item) => item.component?.id !== componentId));
    };

    const handleClearItems = () => setSelectedItems([]);

    const handleSaveBuild = async () => {
        if (!buildName.trim())
            return setNotification({show: true, type: "error", message: "Enter build name"});
        if (selectedItems.length === 0)
            return setNotification({show: true, type: "error", message: "Select at least one item"});

        setIsSubmitting(true);
        const payload = {
            buildName: buildName.trim(),
            buildStatus: "DRAFT",
            itemList: selectedItems.map((i) => ({id: i.id, quantity: i.selectedQuantity.toString()})),
        };

        try {
            if (currentBuildId) await updateBuild({id: currentBuildId, ...payload}).unwrap();
            else {
                const res = await createBuild(payload).unwrap();
                setCurrentBuildId(res.id);
            }
            setNotification({show: true, type: "success", message: "Build saved successfully!"});
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
            setNotification({show: true, type: "success", message: "Build deleted successfully!"});
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
            return setNotification({show: true, type: "error", message: "Select at least one item"});

        setIsSubmitting(true);
        try {
            const existingItems = cartData?.cartItemList || [];
            const updatedItemList = existingItems.map((ci) => ({id: ci.item.id, quantity: ci.cartQuantity}));

            selectedItems.forEach((item) => {
                const index = updatedItemList.findIndex((ci) => ci.id === item.id);
                if (index !== -1) updatedItemList[index].quantity += item.selectedQuantity;
                else updatedItemList.push({id: item.id, quantity: item.selectedQuantity});
            });

            await updateCart({itemList: updatedItemList}).unwrap();
            setNotification({show: true, type: "success", message: "Added selected items to cart!"});
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

    const totalPrice = useMemo(
        () => selectedItems.reduce((sum, item) => sum + (item.price || 0) * (item.selectedQuantity || 1), 0),
        [selectedItems]
    );

    const formatCurrency = (price) =>
        new Intl.NumberFormat("en-LK", {minimumFractionDigits: 2}).format(price);

    if (loadingComponents) return <div className="p-6">Loading...</div>;

    const allNonPowerSelected =
        components.filter((c) => !c.powerSource).every((c) =>
            selectedItems.some((i) => i.component?.id === c.id)
        );

    return (
        <div className="container mx-auto p-4 space-y-6">
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({show: false, type: "", message: ""})}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({show: false, type: "", message: ""})}
                errorMessage={notification.message}
                isActionLoading={isSubmitting}
            />

            <div className="bg-white rounded-lg border p-4 flex gap-3 items-center">
                <input
                    type="text"
                    placeholder="Build name"
                    value={buildName}
                    onChange={(e) => setBuildName(e.target.value)}
                    className="flex-1 h-10 px-3 border rounded text-sm"
                />
                <select
                    value={currentBuildId || ""}
                    onChange={(e) => setCurrentBuildId(Number(e.target.value) || null)}
                    className="h-10 w-56 px-3 border rounded text-sm"
                >
                    <option value="">New Build</option>
                    {userBuilds.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.buildName}
                        </option>
                    ))}
                </select>

                <button onClick={handleSaveBuild} disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 text-white rounded">
                    Save
                </button>

                {currentBuildId && (
                    <button onClick={handleDeleteBuild} disabled={isSubmitting}
                            className="px-4 py-2 bg-red-600 text-white rounded">
                        Delete
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {components.map((comp) => {
                    const selectedItem = selectedItems.find((item) => item.component?.id === comp.id);
                    const isDisabled = comp.powerSource && !allNonPowerSelected; // disable power source until others selected
                    return (
                        <div
                            key={comp.id}
                            onClick={() => {
                                if (!isDisabled) {
                                    setSelectedComponent(comp);
                                    setIsModalOpen(true);
                                }
                            }}
                            className={`flex justify-between items-center bg-white shadow-sm rounded-lg p-4 cursor-pointer hover:bg-gray-50 text-sm ${
                                isDisabled ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        >
                            <div>{comp.componentName}</div>
                            {selectedItem && (
                                <div className="flex items-center gap-3">
                                    <span>{selectedItem.itemName}</span>
                                    <span className=" text-green-600">
                    Rs {formatCurrency(selectedItem.price)} × {selectedItem.selectedQuantity}
                  </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveItem(comp.id);
                                        }}
                                        className="text-red-500"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-lg border p-4 flex justify-between items-center">
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

            <SelectItems
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                component={selectedComponent}
                selectedItems={selectedItems}
                onAddItem={handleAddItem}
            />
        </div>
    );
};

export default BuildCart;