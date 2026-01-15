import {useState, useEffect} from "react";
import ItemListTable from "../common/ItemListTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import {
    useGetItemsQuery,
    useCreateItemMutation,
    useUpdateItemMutation,
    useDeleteItemMutation,
} from "../../features/components/itemApi.js";
import {useGetComponentsQuery} from "../../features/components/componentApi.js";
import {useGetManufacturersQuery} from "../../features/components/manufacturerApi.js";
import {useGetFeaturesQuery} from "../../features/components/featureApi.js";
import {useCreateItemFeatureMutation, useDeleteItemFeatureMutation} from "../../features/components/itemFeatureApi.js";
import {
    useCreateFeatureMutation,
    useUpdateFeatureMutation,
    useDeleteFeatureMutation,
} from "../../features/components/featureApi.js";

const ItemManagement = () => {
    // state
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        itemName: "",
        quantity: "",
        price: "",
        componentId: "",
        manufacturerId: "",
    });
    const [selectedFeatures, setSelectedFeatures] = useState({});
    const [expandedFeatureTypes, setExpandedFeatureTypes] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [filterComponent, setFilterComponent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Feature management state
    const [newFeatureName, setNewFeatureName] = useState("");
    const [editingFeature, setEditingFeature] = useState(null);
    const [selectedFeatureTypeId, setSelectedFeatureTypeId] = useState("");

    // Single notification state
    const [notification, setNotification] = useState({
        show: false,
        type: "", // "success" or "error"
        message: "",
        action: null, // { type: "delete", callback, itemName }
    });

    // api hooks
    const {data: items = [], refetch: refetchItems} = useGetItemsQuery();
    const {data: components = []} = useGetComponentsQuery();
    const {data: manufacturers = []} = useGetManufacturersQuery();
    const {data: allFeatures = [], refetch: refetchAllFeatures} = useGetFeaturesQuery();

    // Mutations
    const [createItem] = useCreateItemMutation();
    const [updateItem] = useUpdateItemMutation();
    const [deleteItem] = useDeleteItemMutation();
    const [createItemFeature] = useCreateItemFeatureMutation();
    const [deleteItemFeature] = useDeleteItemFeatureMutation();
    const [createFeature] = useCreateFeatureMutation();
    const [updateFeature] = useUpdateFeatureMutation();
    const [deleteFeature] = useDeleteFeatureMutation();

    // values and objects
    const filteredItems = items.filter(
        (item) =>
            item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (!filterComponent || item.component?.id === parseInt(filterComponent))
    );

    const selectedComponent = components.find((c) => c.id === parseInt(formData.componentId));
    const componentFeatureTypes = selectedComponent?.componentFeatureTypeList || [];

    // Get features for selected component
    const componentFeatures = allFeatures.filter((feature) =>
        componentFeatureTypes.some((cft) => cft.featureType?.id === feature.featureType?.id)
    );

    // Create a map of feature type ID to feature type name
    const featureTypeMap = {};
    componentFeatureTypes.forEach((cft) => {
        if (cft.featureType?.id) {
            featureTypeMap[cft.featureType.id] = cft.featureType?.featureTypeName || "Unknown";
        }
    });

    // Group features by type
    const groupedFeatures = componentFeatures.reduce((acc, feature) => {
        const typeId = feature.featureType?.id;
        if (typeId) {
            const featureTypeName = featureTypeMap[typeId] || "Unknown";
            if (!acc[typeId]) {
                acc[typeId] = {
                    featureTypeName: featureTypeName,
                    features: [],
                };
            }
            acc[typeId].features.push(feature);
        }
        return acc;
    }, {});

    // Get current feature type name
    const currentFeatureTypeName = featureTypeMap[selectedFeatureTypeId] || "";

    // effects
    useEffect(() => {
        if (selectedItem) {
            const featuresByType = {};
            selectedItem.itemFeatureList?.forEach((itemFeature) => {
                const feature = itemFeature.feature;
                if (feature?.featureType?.id) {
                    const typeId = feature.featureType.id;
                    if (!featuresByType[typeId]) featuresByType[typeId] = {};
                    featuresByType[typeId][feature.id] = {
                        featureId: feature.id,
                        itemFeatureId: itemFeature.id,
                        featureName: feature.featureName,
                    };
                }
            });
            setSelectedFeatures(featuresByType);

            setFormData({
                itemName: selectedItem.itemName,
                quantity: selectedItem.quantity.toString(),
                price: selectedItem.price.toString(),
                componentId: selectedItem.component?.id || "",
                manufacturerId: selectedItem.manufacturer?.id || "",
            });
        }
    }, [selectedItem]);

    // Set first feature type when component changes
    useEffect(() => {
        if (componentFeatureTypes.length > 0 && !selectedFeatureTypeId) {
            const firstTypeId = componentFeatureTypes[0]?.featureType?.id;
            if (firstTypeId) {
                setSelectedFeatureTypeId(firstTypeId);
            }
        }
    }, [componentFeatureTypes, selectedFeatureTypeId]);

    // notification handlers
    const showNotification = (type, message, action = null) => {
        setNotification({show: true, type, message, action});
    };

    const handleConfirmAction = async () => {
        if (notification.action) {
            const {callback} = notification.action;
            setIsSubmitting(true);
            try {
                await callback();
                showNotification("success", notification.action.successMessage || "Action completed!");
            } catch (error) {
                console.error("Error:", error);
                showNotification("error", notification.action.errorMessage || "Error performing action.");
            } finally {
                setIsSubmitting(false);
                setNotification((prev) => ({...prev, action: null}));
            }
        }
    };

    // handlers
    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));

        if (name === "componentId") {
            setSelectedFeatures({});
            setSelectedFeatureTypeId("");
            setNewFeatureName("");
            setEditingFeature(null);
        }
    };

    const handleSelectItem = (item) => {
        setSelectedItem(item);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const requiredFields = ["itemName", "componentId", "manufacturerId"];
        const missingField = requiredFields.find((field) => !formData[field]);
        if (missingField) {
            showNotification("error", `Please fill in ${missingField}`);
            setIsSubmitting(false);
            return;
        }

        const itemData = {
            ...formData,
            quantity: formData.quantity || "0",
            price: formData.price || "0.00",
        };

        try {
            let result;
            if (selectedItem) {
                result = await updateItem({id: selectedItem.id, ...itemData}).unwrap();
                showNotification("success", "Item updated successfully!");
            } else {
                result = await createItem(itemData).unwrap();

                // Create item-feature relationships
                const featurePromises = Object.values(selectedFeatures).flatMap((featureType) =>
                    Object.values(featureType).map((feature) =>
                        createItemFeature({itemId: result.id, featureId: feature.featureId})
                    )
                );
                await Promise.all(featurePromises);
                showNotification("success", "Item created successfully!");
            }

            handleResetForm();
            refetchItems();
        } catch (error) {
            console.error("Error saving item:", error);
            showNotification("error", "Error saving item. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleFeature = async (feature) => {
        const typeId = feature.featureType?.id;
        const featureId = feature.id;
        const isSelected = selectedFeatures[typeId]?.[featureId];

        if (isSelected) {
            // Remove feature
            if (selectedItem) {
                const itemFeatureId = selectedFeatures[typeId][featureId].itemFeatureId;
                await deleteItemFeature(itemFeatureId).unwrap();
            }

            setSelectedFeatures((prev) => {
                const updated = {...prev};
                if (updated[typeId]) {
                    delete updated[typeId][featureId];
                    if (Object.keys(updated[typeId]).length === 0) delete updated[typeId];
                }
                return updated;
            });

            showNotification("success", "Feature removed!");
        } else {
            // Add feature
            if (selectedItem) {
                const result = await createItemFeature({
                    itemId: selectedItem.id,
                    featureId: featureId,
                }).unwrap();

                setSelectedFeatures((prev) => ({
                    ...prev,
                    [typeId]: {
                        ...prev[typeId],
                        [featureId]: {
                            featureId,
                            itemFeatureId: result.id,
                            featureName: feature.featureName,
                        },
                    },
                }));

                showNotification("success", "Feature added!");
            } else {
                setSelectedFeatures((prev) => ({
                    ...prev,
                    [typeId]: {
                        ...prev[typeId],
                        [featureId]: {
                            featureId,
                            featureName: feature.featureName,
                        },
                    },
                }));
            }
        }
    };

    const toggleFeatureType = (typeId) => {
        setExpandedFeatureTypes((prev) => ({
            ...prev,
            [typeId]: !prev[typeId],
        }));
    };

    const handleCreateFeature = async () => {
        if (!newFeatureName.trim() || !selectedFeatureTypeId) {
            showNotification("error", "Please enter a feature name");
            return;
        }

        setIsSubmitting(true);
        try {
            await createFeature({
                featureName: newFeatureName.trim(),
                featureTypeId: parseInt(selectedFeatureTypeId),
            }).unwrap();

            await refetchAllFeatures();
            setNewFeatureName("");
            showNotification("success", "Feature created!");
        } catch (error) {
            console.error("Error creating feature:", error);
            showNotification("error", "Error creating feature.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditFeature = async () => {
        if (!editingFeature || !newFeatureName.trim()) return;

        setIsSubmitting(true);
        try {
            await updateFeature({
                id: editingFeature.id,
                featureName: newFeatureName.trim(),
                featureTypeId: parseInt(selectedFeatureTypeId),
            }).unwrap();

            await refetchAllFeatures();

            setEditingFeature(null);
            setNewFeatureName("");
            showNotification("success", "Feature updated!");
        } catch (error) {
            console.error("Error updating feature:", error);
            showNotification("error", "Error updating feature.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteFeature = (feature) => {
        showNotification("error", `Are you sure you want to delete "${feature.featureName}"?`, {
            callback: async () => {
                await deleteFeature(feature.id).unwrap();
                await refetchAllFeatures();
            },
            successMessage: "Feature deleted!",
            errorMessage: "Error deleting feature.",
        });
    };

    const handleStartEditFeature = (feature) => {
        setEditingFeature(feature);
        setNewFeatureName(feature.featureName);
        setSelectedFeatureTypeId(feature.featureType?.id || "");
    };

    const handleCancelEdit = () => {
        setEditingFeature(null);
        setNewFeatureName("");
    };

    const handleDeleteItem = (item) => {
        showNotification("error", `Are you sure you want to delete "${item.itemName}"?`, {
            callback: async () => {
                await deleteItem(item.id).unwrap();
                refetchItems();
                if (selectedItem?.id === item.id) {
                    handleResetForm();
                }
            },
            successMessage: "Item deleted successfully!",
            errorMessage: "Error deleting item.",
        });
    };

    const handleResetForm = () => {
        setSelectedItem(null);
        setFormData({
            itemName: "",
            quantity: "",
            price: "",
            componentId: "",
            manufacturerId: "",
        });
        setSelectedFeatures({});
        setNewFeatureName("");
        setEditingFeature(null);
        setSelectedFeatureTypeId("");
    };

    // render
    const columns = [
        {
            key: "itemName",
            header: "Item Name",
            render: (item) => <div className="text-sm font-medium">{item.itemName}</div>,
        },
        {
            key: "component",
            header: "Component",
            render: (item) => <div className="text-sm">{item.component?.componentName || "N/A"}</div>,
        },
        {
            key: "price",
            header: "Price",
            render: (item) => <div className="text-sm">Rs {parseFloat(item.price || 0).toFixed(2)}</div>,
        },
    ];

    const selectedFeaturesCount = Object.values(selectedFeatures).reduce(
        (total, featureType) => total + Object.keys(featureType).length,
        0
    );

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">Item Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Item List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    className="w-full pl-4 pr-10 py-2 border rounded"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm("")}
                                            className="absolute right-3 top-2.5 text-gray-400">
                                        ✕
                                    </button>
                                )}
                            </div>
                            <select
                                className="w-48 p-2.5 border rounded"
                                value={filterComponent}
                                onChange={(e) => setFilterComponent(e.target.value)}
                            >
                                <option value="">All Components</option>
                                {components.map((component) => (
                                    <option key={component.id} value={component.id}>
                                        {component.componentName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <ItemListTable
                        items={filteredItems}
                        selectedItem={selectedItem}
                        onSelectItem={handleSelectItem}
                        onDeleteItemClick={handleDeleteItem}
                        isLoading={false}
                        columns={columns}
                        emptyMessage="No items found"
                    />
                </div>

                {/* Right Column: Item Form */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                name="itemName"
                                placeholder="Item Name *"
                                className="w-full p-2 border rounded"
                                value={formData.itemName}
                                onChange={handleInputChange}
                                required
                            />

                            <select
                                name="componentId"
                                className="w-full p-2 border rounded"
                                value={formData.componentId}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Component *</option>
                                {components.map((component) => (
                                    <option key={component.id} value={component.id}>
                                        {component.componentName}
                                    </option>
                                ))}
                            </select>

                            <select
                                name="manufacturerId"
                                className="w-full p-2 border rounded"
                                value={formData.manufacturerId}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Manufacturer *</option>
                                {manufacturers.map((manufacturer) => (
                                    <option key={manufacturer.id} value={manufacturer.id}>
                                        {manufacturer.manufacturerName}
                                    </option>
                                ))}
                            </select>

                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    name="quantity"
                                    placeholder="Quantity"
                                    className="p-2 border rounded"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    min="0"
                                />
                                <input
                                    type="number"
                                    name="price"
                                    placeholder="Price (Rs)"
                                    className="p-2 border rounded"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.itemName.trim() || !formData.componentId || !formData.price || !formData.quantity || !formData.manufacturerId
                                    }
                                    className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? "..." : selectedItem ? "Update" : "Create"}
                                </button>
                                {!selectedItem && (formData.itemName.trim() || formData.componentId || formData.price || formData.quantity || formData.manufacturerId) && (
                                    <button
                                        type="button"
                                        onClick={handleResetForm}
                                        className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        Clear
                                    </button>
                                )}
                                {selectedItem && (
                                    <button
                                        type="button"
                                        onClick={handleResetForm}
                                        className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Feature Management - SIMPLE AND INLINE */}
                    {formData.componentId && (
                        <div className="bg-white rounded-lg border p-4">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="font-medium">Features</h4>
                                    <p className="text-sm text-gray-500">{selectedFeaturesCount} selected</p>
                                </div>
                            </div>

                            {/* Feature Type Selector and Create/Edit Form */}
                            <div className="mb-4">
                                <div className="flex gap-2 mb-2">
                                    <select
                                        className="flex-1 p-2 border rounded text-sm"
                                        value={selectedFeatureTypeId}
                                        onChange={(e) => {
                                            setSelectedFeatureTypeId(e.target.value);
                                            setNewFeatureName("");
                                            setEditingFeature(null);
                                        }}
                                    >
                                        <option value="">Select Feature Type</option>
                                        {componentFeatureTypes.map((cft) => (
                                            <option key={cft.featureType?.id} value={cft.featureType?.id}>
                                                {cft.featureType?.featureTypeName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Create/Edit Feature Input */}
                                {selectedFeatureTypeId && (
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            placeholder={`New ${currentFeatureTypeName} feature...`}
                                            className="flex-1 p-2 border rounded text-sm"
                                            value={newFeatureName}
                                            onChange={(e) => setNewFeatureName(e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                        {editingFeature ? (
                                            <>
                                                <button
                                                    onClick={handleEditFeature}
                                                    disabled={isSubmitting || !newFeatureName.trim()}
                                                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={isSubmitting}
                                                    className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={handleCreateFeature}
                                                disabled={isSubmitting || !newFeatureName.trim()}
                                                className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Features List - Organized by Feature Type */}
                            {Object.entries(groupedFeatures).map(([typeId, {featureTypeName, features}]) => {
                                const isExpanded = expandedFeatureTypes[typeId] !== false; // Default to expanded

                                return (
                                    <div key={typeId} className="mb-4">
                                        <button
                                            type="button"
                                            onClick={() => toggleFeatureType(typeId)}
                                            className="flex items-center justify-between w-full p-2 border rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-sm font-medium text-gray-700">{featureTypeName}</span>

                                                <span
                                                    className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                          {Object.keys(selectedFeatures[typeId] || {}).length} selected
                        </span>
                                            </div>
                                            <span className="text-gray-500">{isExpanded ? "▼" : "▶"}</span>
                                        </button>

                                        {!isExpanded && (
                                            <div className="mt-2 space-y-1">
                                                {features.map((feature) => {
                                                    const isSelected = selectedFeatures[typeId]?.[feature.id];
                                                    const isEditing = editingFeature?.id === feature.id;

                                                    return (
                                                        <div
                                                            key={feature.id}
                                                            className={`flex items-center justify-between p-2 border rounded transition-colors ${
                                                                isSelected ? "bg-green-50 border-green-200" : "bg-white hover:bg-gray-50"
                                                            } ${isEditing ? "bg-blue-50 border-blue-200" : ""}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    onClick={() => handleToggleFeature(feature)}
                                                                    className={`w-4 h-4 border rounded flex items-center justify-center cursor-pointer transition-colors ${
                                                                        isSelected
                                                                            ? "bg-green-500 border-green-600"
                                                                            : "border-gray-300 bg-white hover:bg-gray-100"
                                                                    }`}
                                                                >
                                                                    {isSelected && "✓"}
                                                                </div>
                                                                <span className="text-sm">{feature.featureName}</span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleStartEditFeature(feature)}
                                                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteFeature(feature)}
                                                                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Unified Notification Dialog */}
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({show: false, type: "", message: "", action: null})}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({show: false, type: "", message: "", action: null})}
                errorMessage={notification.message}
                errorAction={notification.action}
                onErrorAction={handleConfirmAction}
                isActionLoading={isSubmitting}
            />
        </div>
    );
};

export default ItemManagement;
