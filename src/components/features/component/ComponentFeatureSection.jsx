// components/ComponentFeatureSection.jsx
import { useState } from "react";
import {
    useGetFeatureTypesQuery,
    useSaveFeatureTypeMutation,
    useUpdateFeatureTypeMutation,
    useDeleteFeatureTypeMutation,
} from "../../../features/components/featureTypeApi.js";
import {
    useGetComponentFeatureTypesByComponentIdQuery,
    useCreateComponentFeatureTypeMutation,
    useDeleteComponentFeatureTypeMutation,
} from "../../../features/components/componentFeatureTypeApi.js";

const ComponentFeatureSection = ({
                                     selectedComponent,
                                     showNotification,
                                     isSubmitting,
                                     setIsSubmitting,
                                 }) => {
    // Local state
    const [expandedFeatureTypes, setExpandedFeatureTypes] = useState({});
    const [newFeatureTypeName, setNewFeatureTypeName] = useState("");
    const [editingFeatureType, setEditingFeatureType] = useState(null);

    // API hooks
    const { data: allFeatureTypes = [], refetch: refetchAllFeatureTypes } = useGetFeatureTypesQuery();
    const { data: componentFeatureTypes = [], refetch: refetchComponentFeatureTypes } =
        useGetComponentFeatureTypesByComponentIdQuery(selectedComponent?.id || null, {
            skip: !selectedComponent,
        });

    // Mutations
    const [createFeatureType] = useSaveFeatureTypeMutation();
    const [updateFeatureType] = useUpdateFeatureTypeMutation();
    const [deleteFeatureType] = useDeleteFeatureTypeMutation();
    const [createComponentFeatureType] = useCreateComponentFeatureTypeMutation();
    const [deleteComponentFeatureType] = useDeleteComponentFeatureTypeMutation();

    // Early return if no component selected
    if (!selectedComponent) return null;

    // Feature type handlers
    const handleCreateFeatureType = async () => {
        if (!newFeatureTypeName.trim()) {
            showNotification("error", "Please enter a feature type name");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createFeatureType({ featureTypeName: newFeatureTypeName.trim() }).unwrap();

            if (selectedComponent) {
                await createComponentFeatureType({
                    componentId: selectedComponent.id,
                    featureTypeId: result.id,
                }).unwrap();
                await refetchComponentFeatureTypes();
            }

            await refetchAllFeatureTypes();
            setNewFeatureTypeName("");
            showNotification("success", "Feature type created and assigned!");
        } catch (error) {
            console.error("Error creating feature type:", error);
            showNotification("error", "Error creating feature type.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditFeatureType = async () => {
        if (!editingFeatureType || !editingFeatureType.featureTypeName.trim()) return;

        setIsSubmitting(true);
        try {
            await updateFeatureType({
                id: editingFeatureType.id,
                featureTypeName: editingFeatureType.featureTypeName.trim(),
            }).unwrap();

            await refetchAllFeatureTypes();
            setEditingFeatureType(null);
            setNewFeatureTypeName("");
            showNotification("success", "Feature type updated!");
        } catch (error) {
            console.error("Error updating feature type:", error);
            showNotification("error", "Error updating feature type.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleFeatureType = async (featureType, assign) => {
        if (!selectedComponent) return;

        setIsSubmitting(true);
        try {
            if (assign) {
                await createComponentFeatureType({
                    componentId: selectedComponent.id,
                    featureTypeId: featureType.id,
                }).unwrap();
                showNotification("success", "Feature type added!");
            } else {
                const componentFeatureType = componentFeatureTypes.find((cft) => cft.featureType?.id === featureType.id);
                if (componentFeatureType) {
                    await deleteComponentFeatureType(componentFeatureType.id).unwrap();
                    showNotification("success", "Feature type removed!");
                }
            }

            await refetchComponentFeatureTypes();
        } catch (error) {
            console.error("Error toggling feature type:", error);
            showNotification("error", "Error updating feature type assignment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteFeatureType = (featureType) => {
        showNotification("error", `Are you sure you want to delete "${featureType.featureTypeName}"?`, {
            callback: async () => {
                await deleteFeatureType(featureType.id).unwrap();
                await refetchAllFeatureTypes();
            },
            successMessage: "Feature type deleted!",
            errorMessage: "Error deleting feature type.",
        });
    };

    const handleStartEditFeatureType = (featureType) => {
        setEditingFeatureType({ ...featureType });
        setNewFeatureTypeName(featureType.featureTypeName);
    };

    const handleCancelEdit = () => {
        setEditingFeatureType(null);
        setNewFeatureTypeName("");
    };

    const toggleFeatureTypeGroup = (groupName) => {
        setExpandedFeatureTypes((prev) => ({
            ...prev,
            [groupName]: !prev[groupName],
        }));
    };

    return (
        <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h4 className="font-medium">Feature Types</h4>
                </div>
            </div>

            {/* Create Feature Type */}
            <div className="mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="New feature type..."
                        className="flex-1 p-2 border rounded text-sm"
                        value={editingFeatureType?.featureTypeName || newFeatureTypeName}
                        onChange={(e) =>
                            editingFeatureType
                                ? setEditingFeatureType({ ...editingFeatureType, featureTypeName: e.target.value })
                                : setNewFeatureTypeName(e.target.value)
                        }
                        disabled={isSubmitting}
                    />
                    {editingFeatureType ? (
                        <>
                            <button
                                onClick={handleEditFeatureType}
                                disabled={isSubmitting || !editingFeatureType.featureTypeName.trim()}
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
                            onClick={handleCreateFeatureType}
                            disabled={isSubmitting || !newFeatureTypeName.trim()}
                            className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                            Add
                        </button>
                    )}
                </div>
            </div>

            {/* All Feature Types List */}
            {allFeatureTypes.length > 0 && (
                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={() => toggleFeatureTypeGroup("all")}
                        className="flex items-center justify-between w-full p-2 border rounded bg-gray-50 hover:bg-gray-100"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">All Feature Types ({allFeatureTypes.length})</span>
                        </div>
                        <span>{expandedFeatureTypes["all"] !== false ? "▼" : "▶"}</span>
                    </button>

                    {expandedFeatureTypes["all"] !== false && (
                        <div className="space-y-2">
                            {allFeatureTypes.map((featureType) => {
                                const isAssigned = componentFeatureTypes.some(cft => cft.featureType?.id === featureType.id);
                                const isEditing = editingFeatureType?.id === featureType.id;

                                return (
                                    <div
                                        key={featureType.id}
                                        className={`flex items-center justify-between p-2 border rounded ${
                                            isAssigned ? "bg-green-50 border-green-200" : "bg-white hover:bg-gray-50"
                                        } ${isEditing ? "bg-blue-50 border-blue-200" : ""}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                onClick={() => handleToggleFeatureType(featureType, !isAssigned)}
                                                className={`w-4 h-4 border rounded flex items-center justify-center cursor-pointer ${
                                                    isAssigned
                                                        ? "bg-green-500 border-green-600"
                                                        : "border-gray-300 bg-white hover:bg-gray-100"
                                                }`}
                                            >
                                                {isAssigned && "✓"}
                                            </div>
                                            <span className="text-sm">{featureType.featureTypeName}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleStartEditFeatureType(featureType)}
                                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFeatureType(featureType)}
                                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
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
            )}
        </div>
    );
};

export default ComponentFeatureSection;