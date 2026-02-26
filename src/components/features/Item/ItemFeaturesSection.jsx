import {useState, useEffect} from "react";
import {
    useCreateItemFeatureMutation,
    useUpdateItemFeatureMutation,
    useDeleteItemFeatureMutation,
} from "../../../services/itemFeatureApi.js";
import {
    useGetFeaturesQuery,
    useCreateFeatureMutation,
    useUpdateFeatureMutation,
    useDeleteFeatureMutation,
} from "../../../services/featureApi.js";
import {
    useGetComponentFeatureTypesByComponentIdQuery
} from "../../../services/componentFeatureTypeApi.js";

const ItemFeaturesSection = ({
                                 selectedComponent,
                                 selectedItem,
                                 showNotification,
                                 isSubmitting,
                                 setIsSubmitting,
                                 onItemUpdated,
                             }) => {
    // Local state
    const [selectedFeatures, setSelectedFeatures] = useState({});
    const [expandedFeatureTypes, setExpandedFeatureTypes] = useState({});
    const [newFeatureName, setNewFeatureName] = useState("");
    const [editingFeature, setEditingFeature] = useState(null);
    const [selectedFeatureTypeId, setSelectedFeatureTypeId] = useState("");
    const [updatingSlotCount, setUpdatingSlotCount] = useState(null); // { featureId, typeId, currentCount }

    // API hooks - get component feature types directly from API
    const {data: componentFeatureTypes = [], refetch: refetchComponentFeatureTypes} =
        useGetComponentFeatureTypesByComponentIdQuery(selectedComponent?.id, {
            skip: !selectedComponent,
        });

    // Extract feature types from the response
    const featureTypes = componentFeatureTypes
        .map(cft => cft.featureType)
        .filter(Boolean);

    // Get all features
    const {data: allFeatures = [], refetch: refetchAllFeatures} = useGetFeaturesQuery();

    // Filter features that belong to this component's feature types
    const componentFeatures = allFeatures.filter((feature) =>
        featureTypes.some((ft) => ft?.id === feature.featureType?.id)
    );

    // Mutations
    const [createItemFeature] = useCreateItemFeatureMutation();
    const [updateItemFeature] = useUpdateItemFeatureMutation();
    const [deleteItemFeature] = useDeleteItemFeatureMutation();
    const [createFeature] = useCreateFeatureMutation();
    const [updateFeature] = useUpdateFeatureMutation();
    const [deleteFeature] = useDeleteFeatureMutation();

    // Group features by type
    const groupedFeatures = {};
    componentFeatures.forEach(feature => {
        const typeId = feature.featureType?.id;
        if (typeId) {
            if (!groupedFeatures[typeId]) {
                const featureType = featureTypes.find(ft => ft.id === typeId);
                groupedFeatures[typeId] = {
                    featureTypeName: featureType?.featureTypeName || "Unknown",
                    features: [],
                };
            }
            groupedFeatures[typeId].features.push(feature);
        }
    });

    // Refresh when component changes
    useEffect(() => {
        if (selectedComponent) {
            refetchComponentFeatureTypes();
        }
    }, [selectedComponent?.id, refetchComponentFeatureTypes]);

    // Load features when item is selected
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
                        slotCount: itemFeature.slotCount || 0,
                    };
                }
            });
            setSelectedFeatures(featuresByType);
        } else {
            setSelectedFeatures({});
        }
    }, [selectedItem]);

    // Set first feature type when component changes
    useEffect(() => {
        if (featureTypes.length > 0 && !selectedFeatureTypeId) {
            const firstTypeId = featureTypes[0]?.id;
            if (firstTypeId) {
                setSelectedFeatureTypeId(firstTypeId);
            }
        }
    }, [featureTypes, selectedFeatureTypeId]);

    // Feature handlers
    const handleToggleFeature = async (feature) => {
        const typeId = feature.featureType?.id;
        const featureId = feature.id;
        const isSelected = selectedFeatures[typeId]?.[featureId];

        setIsSubmitting(true);
        try {
            if (isSelected) {
                // Remove feature
                if (selectedItem) {
                    const itemFeatureId = selectedFeatures[typeId][featureId].itemFeatureId;
                    const response = await deleteItemFeature(itemFeatureId).unwrap();
                    showNotification("success", response.message || "Feature removed!");
                    if (onItemUpdated) await onItemUpdated();
                } else {
                    showNotification("success", "Feature removed!");
                }

                setSelectedFeatures(prev => {
                    const updated = {...prev};
                    if (updated[typeId]) {
                        delete updated[typeId][featureId];
                        if (Object.keys(updated[typeId]).length === 0) delete updated[typeId];
                    }
                    return updated;
                });
            } else {
                // Add feature
                if (selectedItem) {
                    const result = await createItemFeature({
                        itemId: selectedItem.id,
                        featureId: featureId,
                        slotCount: 1,
                    }).unwrap();

                    setSelectedFeatures(prev => ({
                        ...prev,
                        [typeId]: {
                            ...prev[typeId],
                            [featureId]: {
                                featureId,
                                itemFeatureId: result.id,
                                featureName: feature.featureName,
                                slotCount: 1,
                            },
                        },
                    }));
                    showNotification("success", result.message || "Feature added!");
                    if (onItemUpdated) await onItemUpdated();
                } else {
                    setSelectedFeatures(prev => ({
                        ...prev,
                        [typeId]: {
                            ...prev[typeId],
                            [featureId]: {
                                featureId,
                                featureName: feature.featureName,
                                slotCount: 1,
                            },
                        },
                    }));
                    showNotification("success", "Feature added!");
                }
            }
            // Clear any active slot update
            setUpdatingSlotCount(null);
        } catch (error) {
            console.error("Error:", error);
            showNotification("error", error.data?.message || "Error updating feature.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSlotCount = async (featureId, typeId, newSlotCount) => {
        const parsedSlotCount = parseInt(newSlotCount);
        if (parsedSlotCount < 1) {
            showNotification("error", "Slot count must be at least 1");
            return;
        }

        const itemFeatureId = selectedFeatures[typeId]?.[featureId]?.itemFeatureId;

        if (selectedItem && itemFeatureId) {
            setIsSubmitting(true);
            try {
                const response = await updateItemFeature({
                    id: itemFeatureId,
                    slotCount: parsedSlotCount,
                }).unwrap();

                setSelectedFeatures(prev => ({
                    ...prev,
                    [typeId]: {
                        ...prev[typeId],
                        [featureId]: {
                            ...prev[typeId][featureId],
                            slotCount: parsedSlotCount,
                        },
                    },
                }));
                showNotification("success", response.message || "Slot count updated!");
                if (onItemUpdated) await onItemUpdated();
                setUpdatingSlotCount(null);
            } catch (error) {
                console.error("Error updating slot count:", error);
                showNotification("error", error.data?.message || "Error updating slot count.");
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // For new items not saved yet
            setSelectedFeatures(prev => ({
                ...prev,
                [typeId]: {
                    ...prev[typeId],
                    [featureId]: {
                        ...prev[typeId][featureId],
                        slotCount: parsedSlotCount,
                    },
                },
            }));
            showNotification("success", "Slot count updated!");
            setUpdatingSlotCount(null);
        }
    };

    const handleCreateFeature = async () => {
        if (!newFeatureName.trim() || !selectedFeatureTypeId) {
            showNotification("error", "Please enter a feature name");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createFeature({
                featureName: newFeatureName.trim(),
                featureTypeId: parseInt(selectedFeatureTypeId),
            }).unwrap();

            await refetchAllFeatures();

            if (selectedItem) {
                const itemFeatureResult = await createItemFeature({
                    itemId: selectedItem.id,
                    featureId: result.id,
                    slotCount: 1,
                }).unwrap();

                setSelectedFeatures(prev => ({
                    ...prev,
                    [selectedFeatureTypeId]: {
                        ...prev[selectedFeatureTypeId],
                        [result.id]: {
                            featureId: result.id,
                            itemFeatureId: itemFeatureResult.id,
                            featureName: newFeatureName.trim(),
                            slotCount: 1,
                        },
                    },
                }));
                if (onItemUpdated) await onItemUpdated();
            } else {
                setSelectedFeatures(prev => ({
                    ...prev,
                    [selectedFeatureTypeId]: {
                        ...prev[selectedFeatureTypeId],
                        [result.id]: {
                            featureId: result.id,
                            featureName: newFeatureName.trim(),
                            slotCount: 1,
                        },
                    },
                }));
            }
            setNewFeatureName("");
            showNotification("success", result.message || "Feature created!");
        } catch (error) {
            console.error("Error creating feature:", error);
            showNotification("error", error.data?.message || "Error creating feature.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditFeature = async () => {
        if (!editingFeature || !newFeatureName.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await updateFeature({
                id: editingFeature.id,
                data: {
                    featureName: editingFeature.featureName.trim(),
                    featureTypeId: parseInt(selectedFeatureTypeId),
                }
            }).unwrap();

            await refetchAllFeatures();
            setEditingFeature(null);
            setNewFeatureName("");
            showNotification("success", response.message || "Feature updated!");
        } catch (error) {
            console.error("Error updating feature:", error);
            showNotification("error", error.data?.message || "Error updating feature.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteFeature = (feature) => {
        showNotification("error", `Are you sure you want to delete "${feature.featureName}"?`, {
            callback: async () => {
                try {
                    const response = await deleteFeature(feature.id).unwrap();
                    await refetchAllFeatures();
                    showNotification("success", response.message || "Feature deleted!");
                } catch (error) {
                    console.error("Error deleting feature:", error);
                    throw error;
                }
            },
            successMessage: "Feature deleted!",
            errorMessage: "Error deleting feature.",
        });
    };

    const toggleFeatureType = (typeId) => {
        setExpandedFeatureTypes(prev => ({
            ...prev,
            [typeId]: !prev[typeId],
        }));
    };

    // Early return if no component selected
    if (!selectedComponent) return null;

    return (
        <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h4 className="font-medium">Features</h4>
                </div>
            </div>

            {/* Feature Type Selector */}
            <div className="mb-4">
                <div className="flex gap-2 mb-2">
                    <select
                        className="flex-1 p-2 border rounded text-sm"
                        value={selectedFeatureTypeId}
                        onChange={(e) => {
                            setSelectedFeatureTypeId(e.target.value);
                            setNewFeatureName("");
                            setEditingFeature(null);
                            setUpdatingSlotCount(null);
                        }}
                    >
                        <option value="">Select Feature Type</option>
                        {featureTypes.map(ft => (
                            <option key={ft.id} value={ft.id}>
                                {ft.featureTypeName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Create/Edit Feature Input */}
                {selectedFeatureTypeId && (
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            placeholder="New feature..."
                            className="flex-1 p-2 border rounded text-sm"
                            value={editingFeature?.featureName || newFeatureName}
                            onChange={(e) =>
                                editingFeature
                                    ? setEditingFeature({...editingFeature, featureName: e.target.value})
                                    : setNewFeatureName(e.target.value)
                            }
                            disabled={isSubmitting}
                        />
                        {editingFeature ? (
                            <>
                                <button
                                    onClick={handleEditFeature}
                                    disabled={isSubmitting || !editingFeature.featureName.trim()}
                                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 whitespace-nowrap"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingFeature(null);
                                        setNewFeatureName("");
                                    }}
                                    disabled={isSubmitting}
                                    className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50 whitespace-nowrap"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleCreateFeature}
                                disabled={isSubmitting || !newFeatureName.trim()}
                                className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 whitespace-nowrap"
                            >
                                Add
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Features List */}
            {Object.entries(groupedFeatures).map(([typeId, {featureTypeName, features}]) => {
                const isExpanded = expandedFeatureTypes[typeId] !== false;

                return (
                    <div key={typeId} className="mb-4">
                        <button
                            type="button"
                            onClick={() => toggleFeatureType(typeId)}
                            className="flex items-center justify-between w-full p-2 border rounded bg-gray-50 hover:bg-gray-100"
                        >
                            <span
                                className="text-sm font-medium truncate mr-2">{featureTypeName} ({features.length})</span>
                            <span className="flex-shrink-0">{isExpanded ? "▼" : "▶"}</span>
                        </button>

                        {isExpanded && (
                            <div className="mt-2 space-y-1">
                                {features.map(feature => {
                                    const isSelected = selectedFeatures[typeId]?.[feature.id];
                                    const isUpdatingSlot = updatingSlotCount?.featureId === feature.id &&
                                        updatingSlotCount?.typeId === typeId;
                                    const currentSlotCount = isSelected ? selectedFeatures[typeId][feature.id].slotCount : 0;

                                    return (
                                        <div
                                            key={feature.id}
                                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 border rounded ${
                                                isSelected ? "bg-green-50 border-green-200" : "bg-white hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2 sm:mb-0 min-w-0 flex-1">
                                                <div
                                                    onClick={() => handleToggleFeature(feature)}
                                                    className={`w-4 h-4 border rounded flex items-center justify-center cursor-pointer flex-shrink-0 ${
                                                        isSelected
                                                            ? "bg-green-500 border-green-600"
                                                            : "border-gray-300 bg-white hover:bg-gray-100"
                                                    }`}
                                                >
                                                    {isSelected && "✓"}
                                                </div>
                                                <span className="text-sm truncate" title={feature.featureName}>
                                                    {feature.featureName}
                                                </span>
                                                {isSelected && !isUpdatingSlot && (
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        [{currentSlotCount}]
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 ml-6 sm:ml-0">
                                                {isSelected && isUpdatingSlot ? (
                                                    <div className="flex items-center gap-0.5">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={updatingSlotCount.newCount || currentSlotCount}
                                                            onChange={(e) => setUpdatingSlotCount({
                                                                ...updatingSlotCount,
                                                                newCount: parseInt(e.target.value) || 1
                                                            })}
                                                            className="w-12 p-1 border rounded text-center text-sm bg-white"
                                                            disabled={isSubmitting}
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleUpdateSlotCount(
                                                                feature.id,
                                                                typeId,
                                                                updatingSlotCount.newCount || currentSlotCount
                                                            )}
                                                            disabled={isSubmitting}
                                                            className="px-1.5 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                                            title="Save"
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => setUpdatingSlotCount(null)}
                                                            disabled={isSubmitting}
                                                            className="px-1.5 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                                            title="Cancel"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-0.5">
                                                        {isSelected && (
                                                            <button
                                                                onClick={() => setUpdatingSlotCount({
                                                                    featureId: feature.id,
                                                                    typeId: typeId,
                                                                    newCount: currentSlotCount
                                                                })}
                                                                className="px-1.5 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                                                                title="Update Slots"
                                                            >
                                                                ⌂
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setEditingFeature(feature);
                                                                setNewFeatureName(feature.featureName);
                                                                setSelectedFeatureTypeId(feature.featureType?.id || "");
                                                                setUpdatingSlotCount(null);
                                                            }}
                                                            className="px-1.5 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                            title="Edit"
                                                        >
                                                            ✎
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleDeleteFeature(feature);
                                                                setUpdatingSlotCount(null);
                                                            }}
                                                            className="px-1.5 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                            title="Delete"
                                                        >
                                                            🗑
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {Object.keys(groupedFeatures).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                    No features available for this component
                </div>
            )}
        </div>
    );
};

export default ItemFeaturesSection;