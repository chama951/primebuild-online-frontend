import {useEffect, useState} from "react";
import DataTable from "../common/DataTable.jsx";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import ComponentFeatureSection from "./component/ComponentFeatureSection.jsx";
import {
    useDeleteComponentMutation,
    useGetComponentsQuery,
    useUpdateComponentMutation,
    useSaveComponentMutation,
} from "../../services/componentApi.js";
import Unauthorized from "../common/Unauthorized.jsx";

const ComponentManagement = ({refetchFlag, resetFlag}) => {
    // State
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [componentName, setComponentName] = useState("");
    const [isBuildComponent, setIsBuildComponent] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        action: null,
    });
    const [buildPriority, setBuildPriority] = useState("");
    const [powerSource, setPowerSource] = useState(""); // powerSource

    // API hooks (only component-related)
    const {
        data: components = [],
        error: componentsError, refetch:
            refetchComponents
    }
        = useGetComponentsQuery();

    // Mutations (only component-related)
    const [saveComponent] = useSaveComponentMutation();
    const [updateComponent] = useUpdateComponentMutation();
    const [deleteComponent] = useDeleteComponentMutation();

    useEffect(() => {
        if (refetchFlag) {
            refetchComponents();    // actually trigger the API refetch
            resetFlag();  // reset the flag after refetch
        }
    }, [refetchFlag]);

// Check unauthorized
    const isUnauthorized = () => {
        const errors = [componentsError];
        return errors.some(err => err?.isUnauthorized);
    };

    if (isUnauthorized()) {
        return <Unauthorized/>;
    }

    // Computed values
    const filteredComponents = components.filter((component) =>
        component?.componentName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Notification handler
    const showNotification = (type, message, action = null) => {
        setNotification({show: true, type, message, action});
    };

    const handleConfirmAction = async () => {
        if (notification.action) {
            const {callback} = notification.action;
            setIsSubmitting(true);
            try {
                const result = await callback();
                // Use response message for success if available
                const successMessage = result?.data?.message || notification.action.successMessage || "Action completed!";
                showNotification("success", successMessage);
            } catch (error) {
                console.error("Error:", error);
                // Use error message from response
                const errorMessage = error.data?.message || notification.action.errorMessage || "Error performing action.";
                showNotification("error", errorMessage);
            } finally {
                setIsSubmitting(false);
                setNotification((prev) => ({...prev, action: null}));
            }
        }
    };

    // Component handlers
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!componentName.trim()) {
            showNotification("error", "Please enter a component name");
            return;
        }

        setIsSubmitting(true);
        try {
            let response;
            if (selectedComponent) {
                response = await updateComponent({
                    id: selectedComponent.id,
                    data: {
                        componentName: componentName.trim(),
                        buildComponent: isBuildComponent,
                        buildPriority: buildPriority ? buildPriority.valueOf() : 1,
                        powerSource: powerSource ? powerSource : false, //powerSource
                    }
                }).unwrap();
            } else {
                response = await saveComponent({
                    componentName: componentName.trim(),
                    buildComponent: isBuildComponent,
                    buildPriority: buildPriority ? buildPriority.valueOf() : 1,
                    powerSource: powerSource ? powerSource : false, // powerSource
                }).unwrap();
            }

            // Show success message from API response
            showNotification("success", response.message || "Operation completed successfully!");

            handleResetForm();
            refetchComponents();
        } catch (error) {
            console.error("Error saving component:", error);
            // Show error message from API response
            showNotification("error", error.data?.message || "An error occurred while saving.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectComponent = (component) => {
        setSelectedComponent(component);
        setComponentName(component.componentName);
        setIsBuildComponent(component.buildComponent ?? false);
        setBuildPriority(component.buildPriority);
        setPowerSource(component.powerSource ?? false); // powerSource
    };

    const handleResetForm = () => {
        setSelectedComponent(null);
        setComponentName("");
        setIsBuildComponent(false);
        setBuildPriority("");
        setPowerSource("");
    };

    const handleDeleteComponent = (component) => {
        showNotification("error", `Are you sure you want to delete "${component.componentName}"?`, {
            callback: async () => {
                try {
                    const response = await deleteComponent(component.id).unwrap();
                    refetchComponents();
                    if (selectedComponent?.id === component.id) {
                        handleResetForm();
                    }
                    // Return response to handleConfirmAction to extract message
                    return response;
                } catch (error) {
                    console.error("Error deleting component:", error);
                    throw error; // Re-throw to be caught by handleConfirmAction
                }
            },
            successMessage: "Component deleted successfully!", // Fallback if API doesn't return message
            errorMessage: "Error deleting component.", // Fallback if API doesn't return message
        });
    };

    // DataTable columns
    const columns = [
        {
            key: "id",
            header: "ID",
            render: (item) => <div className="text-sm text-gray-500">#{item.id}</div>,
        },
        {
            key: "componentName",
            header: "Component Name",
            render: (item) => <div className="text-sm font-medium">{item.componentName}</div>,
        },
        {
            key: "isBuildComponent",
            header: "Build",
            render: (item) => (
                <span
                    className={`px-2 py-1 rounded text-xs ${item.buildComponent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {item.buildComponent ? "Yes" : "No"}
        </span>
            ),
        },
        {
            key: "Priority",
            header: "Priority",
            render: (item) => <div className="text-sm text-gray-500">{item.buildPriority}</div>,
        },
    ];

    return (
        <div className="container mx-auto p-4 space-y-6">
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

                    <DataTable
                        items={filteredComponents}
                        selectedItem={selectedComponent}
                        onSelectItem={handleSelectComponent}
                        onDeleteItemClick={handleDeleteComponent}
                        isLoading={false}
                        columns={columns}
                        emptyMessage="No components found" // DataTable component handles this internally
                    />
                </div>

                {/* Right Column: Component Form & Feature Types */}
                <div className="space-y-4">
                    {/* Component Form */}
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

                            {/* NEW: PSUCalc Source Toggle */}
                            <div className="flex items-center justify-between p-3 border rounded">
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="power-source"
                                            type="checkbox"
                                            checked={powerSource}
                                            disabled={isSubmitting || !componentName.trim()}
                                            onChange={(e) => setPowerSource(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </div>
                                    <label htmlFor="power-source" className="font-medium text-gray-700">
                                        Power Source
                                    </label>
                                </div>
                            </div>

                            {/* Build Component Toggle - Compact */}
                            <div className="flex items-center justify-between p-3 border rounded">
                                <div className="flex items-center space-x-3">
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
                                    <label htmlFor="is-build-component" className="font-medium text-gray-700">
                                        Build Component
                                    </label>
                                </div>

                                {isBuildComponent && (
                                    <div className="w-20">
                                        <input
                                            type="number"
                                            min="1"
                                            max="99"
                                            value={buildPriority}
                                            onChange={(e) => setBuildPriority(parseInt(e.target.value) || 1)}
                                            disabled={isSubmitting}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Priority"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !componentName.trim()}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? "..." : selectedComponent ? "Update" : "Create"}
                                </button>
                                {(selectedComponent || componentName.trim()) && (
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

                    {/* Feature Types Section - Self-contained component */}
                    {selectedComponent && (
                        <ComponentFeatureSection
                            selectedComponent={selectedComponent}
                            showNotification={showNotification}
                            isSubmitting={isSubmitting}
                            setIsSubmitting={setIsSubmitting}
                        />
                    )}
                </div>
            </div>

            {/* Global Notification Dialog */}
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

export default ComponentManagement;