import { useState, useEffect } from "react";
import {
    useCreateItemFeatureMutation,
    useUpdateItemFeatureMutation,
    useDeleteItemFeatureMutation,
} from "../../../features/components/itemFeatureApi.js";
import {
    useGetFeaturesQuery,
    useCreateFeatureMutation,
    useUpdateFeatureMutation,
    useDeleteFeatureMutation,
} from "../../../features/components/featureApi.js";

const ItemFeaturesSection = ({
                                 selectedComponent,
                                 selectedItem,
                                 showNotification,
                                 isSubmitting,
                                 setIsSubmitting,
                             }) => {
    // Local state
    const [selectedFeatures, setSelectedFeatures] = useState({});
    const [expandedFeatureTypes, setExpandedFeatureTypes] = useState({});
    const [newFeatureName, setNewFeatureName] = useState("");
    const [editingFeature, setEditingFeature] = useState(null);
    const [selectedFeatureTypeId, setSelectedFeatureTypeId] = useState("");

    // API hooks
    const { data: allFeatures = [], refetch: refetchAllFeatures } = useGetFeaturesQuery();
    const [createItemFeature] = useCreateItemFeatureMutation();
    const [updateItemFeature] = useUpdateItemFeatureMutation();
    const [deleteItemFeature] = useDeleteItemFeatureMutation();
    const [createFeature] = useCreateFeatureMutation();
    const [updateFeature] = useUpdateFeatureMutation();
    const [deleteFeature] = useDeleteFeatureMutation();

    // Get component feature types
    const componentFeatureTypes = selectedComponent?.componentFeatureTypeList || [];

    // Get features for selected component
    const componentFeatures = allFeatures.filter((feature) =>
        componentFeatureTypes.some((cft) => cft.featureType?.id === feature.featureType?.id)
    );

    // Simple feature grouping
    const groupedFeatures = {};
    componentFeatures.forEach(feature => {
        const typeId = feature.featureType?.id;
        if (typeId) {
            if (!groupedFeatures[typeId]) {
                groupedFeatures[typeId] = {
                    featureTypeName: componentFeatureTypes.find(cft => cft.featureType?.id === typeId)?.featureType?.featureTypeName || "Unknown",
                    features: [],
                };
            }
            groupedFeatures[typeId].features.push(feature);
        }
    });

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
        if (componentFeatureTypes.length > 0 && !selectedFeatureTypeId) {
            const firstTypeId = componentFeatureTypes[0]?.featureType?.id;
            if (firstTypeId) {
                setSelectedFeatureTypeId(firstTypeId);
            }
        }
    }, [componentFeatureTypes, selectedFeatureTypeId]);

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
                    await deleteItemFeature(itemFeatureId).unwrap();
                }

                setSelectedFeatures(prev => {
                    const updated = { ...prev };
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
                    showNotification("success", "Feature added!");
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
                }
            }
        } catch (error) {
            console.error("Error:", error);
            showNotification("error", "Error updating feature.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSlotCount = async (featureId, typeId, slotCount) => {
        const parsedSlotCount = parseInt(slotCount);
        if (parsedSlotCount < 1) {
            showNotification("error", "Slot count must be at least 1");
            return;
        }

        const itemFeatureId = selectedFeatures[typeId]?.[featureId]?.itemFeatureId;

        if (selectedItem && itemFeatureId) {
            setIsSubmitting(true);
            try {
                await updateItemFeature({
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
                showNotification("success", "Slot count updated!");
            } catch (error) {
                console.error("Error updating slot count:", error);
                showNotification("error", "Error updating slot count.");
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
                        }}
                    >
                        <option value="">Select Feature Type</option>
                        {componentFeatureTypes.map(cft => (
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
                            placeholder="New feature..."
                            className="flex-1 p-2 border rounded text-sm"
                            value={editingFeature?.featureName || newFeatureName}
                            onChange={(e) =>
                                editingFeature
                                    ? setEditingFeature({ ...editingFeature, featureName: e.target.value })
                                    : setNewFeatureName(e.target.value)
                            }
                            disabled={isSubmitting}
                        />
                        {editingFeature ? (
                            <>
                                <button
                                    onClick={handleEditFeature}
                                    disabled={isSubmitting || !editingFeature.featureName.trim()}
                                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setEditingFeature(null)}
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

            {/* Features List */}
            {Object.entries(groupedFeatures).map(([typeId, { featureTypeName, features }]) => {
                const isExpanded = expandedFeatureTypes[typeId] !== false;

                return (
                    <div key={typeId} className="mb-4">
                        <button
                            type="button"
                            onClick={() => toggleFeatureType(typeId)}
                            className="flex items-center justify-between w-full p-2 border rounded bg-gray-50 hover:bg-gray-100"
                        >
                            <span className="text-sm font-medium">{featureTypeName} ({features.length})</span>
                            <span>{isExpanded ? "▼" : "▶"}</span>
                        </button>

                        {isExpanded && (
                            <div className="mt-2 space-y-1">
                                {features.map(feature => {
                                    const isSelected = selectedFeatures[typeId]?.[feature.id];
                                    const slotCount = isSelected ? selectedFeatures[typeId][feature.id].slotCount || 0 : 0;

                                    return (
                                        <div
                                            key={feature.id}
                                            className={`flex items-center justify-between p-2 border rounded ${
                                                isSelected ? "bg-green-50 border-green-200" : "bg-white hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    onClick={() => handleToggleFeature(feature)}
                                                    className={`w-4 h-4 border rounded flex items-center justify-center cursor-pointer ${
                                                        isSelected
                                                            ? "bg-green-500 border-green-600"
                                                            : "border-gray-300 bg-white hover:bg-gray-100"
                                                    }`}
                                                >
                                                    {isSelected && "✓"}
                                                </div>
                                                <span className="text-sm">{feature.featureName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isSelected && (
                                                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                                        <span className="text-xs text-gray-600">Slots:</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={slotCount}
                                                            onChange={(e) => handleUpdateSlotCount(feature.id, typeId, e.target.value)}
                                                            className="w-12 p-1 border rounded text-center text-sm bg-white"
                                                            disabled={isSubmitting}
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingFeature(feature);
                                                            setNewFeatureName(feature.featureName);
                                                            setSelectedFeatureTypeId(feature.featureType?.id || "");
                                                        }}
                                                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFeature(feature)}
                                                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
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
    );
};

export default ItemFeaturesSection;