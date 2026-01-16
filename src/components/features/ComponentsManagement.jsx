import { useState } from "react";
import ItemListTable from "../common/ItemListTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import {
    useDeleteComponentMutation,
    useGetComponentsQuery,
    useUpdateComponentMutation,
    useSaveComponentMutation,
} from "../../features/components/componentApi.js";
import {
    useGetFeatureTypesQuery,
    useSaveFeatureTypeMutation,
    useUpdateFeatureTypeMutation,
    useDeleteFeatureTypeMutation,
} from "../../features/components/featureTypeApi.js";
import {
    useGetComponentFeatureTypesByComponentIdQuery,
    useCreateComponentFeatureTypeMutation,
    useDeleteComponentFeatureTypeMutation,
} from "../../features/components/componentFeatureTypeApi.js";

export default function ComponentManagement() {
    // state
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [componentName, setComponentName] = useState("");
    const [isBuildComponent, setIsBuildComponent] = useState(false); // New state
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Feature type management state
    const [newFeatureTypeName, setNewFeatureTypeName] = useState("");
    const [editingFeatureType, setEditingFeatureType] = useState(null);
    const [expandedFeatureTypes, setExpandedFeatureTypes] = useState({});

    // Single notification state
    const [notification, setNotification] = useState({
        show: false,
        type: "", // "success" or "error"
        message: "",
        action: null,
    });

    // api hooks
    const { data: components = [], refetch: refetchComponents } = useGetComponentsQuery();
    const { data: allFeatureTypes = [], refetch: refetchAllFeatureTypes } = useGetFeatureTypesQuery();
    const { data: componentFeatureTypes = [], refetch: refetchComponentFeatureTypes } =
        useGetComponentFeatureTypesByComponentIdQuery(selectedComponent?.id || null, {
            skip: !selectedComponent,
        });

    // Mutations
    const [saveComponent] = useSaveComponentMutation();
    const [updateComponent] = useUpdateComponentMutation();
    const [deleteComponent] = useDeleteComponentMutation();
    const [createFeatureType] = useSaveFeatureTypeMutation();
    const [updateFeatureType] = useUpdateFeatureTypeMutation();
    const [deleteFeatureType] = useDeleteFeatureTypeMutation();
    const [createComponentFeatureType] = useCreateComponentFeatureTypeMutation();
    const [deleteComponentFeatureType] = useDeleteComponentFeatureTypeMutation();

    // values and objects
    const filteredComponents = components.filter((component) =>
        component?.componentName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const assignedFeatureTypeIds = componentFeatureTypes.map((cft) => cft.featureType?.id).filter((id) => id);
    const assignedFeatureTypes = allFeatureTypes.filter((ft) => assignedFeatureTypeIds.includes(ft.id));

    // Count selected feature types
    const selectedFeatureTypesCount = assignedFeatureTypes.length;

    // notification handlers
    const showNotification = (type, message, action = null) => {
        setNotification({ show: true, type, message, action });
    };

    const handleConfirmAction = async () => {
        if (notification.action) {
            const { callback } = notification.action;
            setIsSubmitting(true);
            try {
                await callback();
                showNotification("success", notification.action.successMessage || "Action completed!");
            } catch (error) {
                console.error("Error:", error);
                showNotification("error", notification.action.errorMessage || "Error performing action.");
            } finally {
                setIsSubmitting(false);
                setNotification((prev) => ({ ...prev, action: null }));
            }
        }
    };

    // component handlers
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!componentName.trim()) {
            showNotification("error", "Please enter a component name");
            return;
        }

        setIsSubmitting(true);
        try {
            const componentData = {
                componentName: componentName.trim(),
                isBuildComponent: isBuildComponent,
                componentFeatureTypeList: [], // Empty array as per your example
            };

            if (selectedComponent) {
                await updateComponent({
                    id: selectedComponent.id,
                    componentName: componentName.trim(),
                    isBuildComponent: isBuildComponent,
                }).unwrap();
                showNotification("success", "Component updated successfully!");
            } else {
                await saveComponent(componentData).unwrap();
                showNotification("success", "Component created successfully!");
            }

            handleResetForm();
            refetchComponents();
        } catch (error) {
            console.error("Error saving component:", error);
            showNotification("error", "Error saving component.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectComponent = (component) => {
        setSelectedComponent(component);
        setComponentName(component.componentName);
        setIsBuildComponent(component.isBuildComponent ?? true); // Default to true if undefined
    };

    const handleResetForm = () => {
        setSelectedComponent(null);
        setComponentName("");
        setIsBuildComponent(false); // Reset to default
        setNewFeatureTypeName("");
        setEditingFeatureType(null);
    };

    const handleDeleteComponent = (component) => {
        showNotification("error", `Are you sure you want to delete "${component.componentName}"?`, {
            callback: async () => {
                await deleteComponent(component.id).unwrap();
                refetchComponents();
                if (selectedComponent?.id === component.id) {
                    handleResetForm();
                }
            },
            successMessage: "Component deleted!",
            errorMessage: "Error deleting component.",
        });
    };

    // feature type handlers (unchanged)
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
            showNotification("success", "Feature type updated!");
        } catch (error) {
            console.error("Error updating feature type:", error);
            showNotification("error", "Error updating feature type.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteFeatureType = (featureType) => {
        showNotification("error", `Are you sure you want to delete "${featureType.featureTypeName}"?`, {
            callback: async () => {
                console.log(featureType.id);
                await deleteFeatureType(featureType.id).unwrap();
                await refetchAllFeatureTypes();
            },
            successMessage: "Feature type deleted!",
            errorMessage: "Error deleting feature type.",
        });
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

    const handleStartEditFeatureType = (featureType) => {
        setEditingFeatureType({ ...featureType });
    };

    const handleCancelEdit = () => {
        setEditingFeatureType(null);
    };

    const toggleFeatureTypeGroup = (groupName) => {
        setExpandedFeatureTypes((prev) => ({
            ...prev,
            [groupName]: !prev[groupName],
        }));
    };

    // render
    const columns = [
        {
            key: "componentName",
            header: "Component Name",
            render: (item) => <div className="text-sm font-medium">{item.componentName}</div>,
        },
        {

            key: "id",
            header: "ID",
            render: (item) => <div className="text-sm text-gray-500">#{item.id}</div>,
        },
    ];

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">Component Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Components List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search components..."
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
                        </div>
                    </div>

                    <ItemListTable
                        items={filteredComponents}
                        selectedItem={selectedComponent}
                        onSelectItem={handleSelectComponent}
                        onDeleteItemClick={handleDeleteComponent}
                        isLoading={false}
                        columns={columns}
                        emptyMessage="No components found"
                    />
                </div>

                {/* Right Column: Component Form */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg border p-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Component Name *"
                                className="w-full p-2 border rounded"
                                value={componentName}
                                onChange={(e) => setComponentName(e.target.value)}
                                required
                            />

                            {/* Build Component Toggle */}
                            <div className="flex items-center space-x-3 p-3 border rounded bg-gray-50">
                                <div className="flex items-center h-5">
                                    <input
                                        id="is-build-component"
                                        type="checkbox"
                                        disabled={isSubmitting || !componentName.trim()}
                                        checked={isBuildComponent}
                                        onChange={(e) => setIsBuildComponent(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="is-build-component" className="font-medium text-gray-700">
                                        Build Component
                                    </label>

                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !componentName.trim()}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? "..." : selectedComponent ? "Update" : "Create"}
                                </button>
                                {!selectedComponent && componentName.trim() && (
                                    <button
                                        type="button"
                                        onClick={handleResetForm}
                                        className="flex-1 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                    >
                                        Clear
                                    </button>
                                )}
                                {selectedComponent && (
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

                    {/* Feature Types Management - Only show when component is selected */}
                    {selectedComponent && (
                        <div className="bg-white rounded-lg border p-4">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="font-medium">Feature Types</h4>
                                    <p className="text-sm text-gray-500">{selectedFeatureTypesCount} assigned</p>
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
                                                ? setEditingFeatureType({
                                                    ...editingFeatureType,
                                                    featureTypeName: e.target.value
                                                })
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
                                <p className="text-xs text-gray-500 mt-1">
                                    New feature types will be automatically assigned to this component
                                </p>
                            </div>

                            {/* All Feature Types List - Combined with checkboxes */}
                            {allFeatureTypes.length > 0 && (
                                <div className="space-y-4">
                                    <button
                                        type="button"
                                        onClick={() => toggleFeatureTypeGroup("all")}
                                        className="flex items-center justify-between w-full p-2 border rounded bg-gray-50 hover:bg-gray-100"
                                    >
                                        <div className="flex items-center gap-2">
                      <span
                          className="text-sm font-medium">All Feature Types ({allFeatureTypes.length})</span>
                                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                        {selectedFeatureTypesCount} assigned
                      </span>
                                        </div>
                                        <span>{expandedFeatureTypes["all"] !== false ? "▼" : "▶"}</span>
                                    </button>

                                    {expandedFeatureTypes["all"] !== false && (
                                        <div className="space-y-2">
                                            {allFeatureTypes.map((featureType) => {
                                                const isAssigned = assignedFeatureTypeIds.includes(featureType.id);
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
                                                            <span
                                                                className="text-sm">{featureType.featureTypeName}</span>
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
                    )}
                </div>
            </div>

            {/* common Notification Dialog */}
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                errorMessage={notification.message}
                errorAction={notification.action}
                onErrorAction={handleConfirmAction}
                isActionLoading={isSubmitting}
            />
        </div>
    );
}