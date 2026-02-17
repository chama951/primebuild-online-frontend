import React, {useState, useMemo, useEffect} from 'react';
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import {useGetBuildComponentsQuery} from '../../features/components/componentApi.js';
import {useGetItemsByComponentIdQuery} from "../../features/components/itemApi.js";
import {
    useGetCompatibleItemsByComponentQuery,
    useGetCompatiblePowerSourcesQuery
} from '../../features/components/compatibilityApi';
import Unauthorized from "../common/Unauthorized.jsx";


const BuildCart = ({refetchFlag, resetFlag}) => {

    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemSearchTerm, setItemSearchTerm] = useState('');
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        action: null,
    });

    // API hooks
    const {
        data: components = [],
        isLoading: loadingComponents,
        error: componentsError,
        refetch: refetchComponents
    } = useGetBuildComponentsQuery(true);

    const {
        data: allItems = [],
        isLoading: loadingAllItems,
        error: allItemsError,
        refetch: refetchAllItems
    } = useGetItemsByComponentIdQuery(
        selectedComponent?.id,
        {skip: !selectedComponent}
    );

    const {
        data: compatibleData = {},
        isLoading: loadingCompatible,
        error: compatibleError,
        refetch: refetchCompatible
    } = useGetCompatibleItemsByComponentQuery(
        selectedComponent && selectedItems.length > 0 &&
        !(selectedComponent.powerSource === true || selectedComponent.powerSource === "true")
            ? {componentId: selectedComponent.id, selectedItems}
            : null,
        {
            skip:
                !selectedComponent ||
                selectedItems.length === 0 ||
                (selectedComponent.powerSource === true ||
                    selectedComponent.powerSource === "true")
        }
    );

    const {
        data: compatiblePowerSources = [],
        isLoading: loadingPowerSources,
        error: powerSourcesError,
        refetch: refetchPowerSources
    } = useGetCompatiblePowerSourcesQuery(
        selectedComponent && selectedItems.length > 0 &&
        (selectedComponent.powerSource === true || selectedComponent.powerSource === "true")
            ? {componentId: selectedComponent.id, selectedItems}
            : null,
        {
            skip:
                !selectedComponent ||
                selectedItems.length === 0 ||
                !(selectedComponent.powerSource === true || selectedComponent.powerSource === "true")
        }
    );

    // Handle external refetch from Dashboard
    useEffect(() => {
        if (refetchFlag) {
            refetchComponents();
            if (selectedComponent) refetchAllItems();
            if (selectedItems.length > 0) {
                const isPower = selectedComponent?.powerSource === true || selectedComponent?.powerSource === "true";
                if (isPower) refetchPowerSources();
                else refetchCompatible();
            }
            resetFlag();
        }
    }, [refetchFlag]);

    // Show API errors as notifications
    useEffect(() => {
        if (componentsError) showNotification("error", componentsError.data?.message || "Failed to load components");
    }, [componentsError]);
    useEffect(() => {
        if (allItemsError && selectedComponent) showNotification("error", allItemsError.data?.message || "Failed to load items");
    }, [allItemsError, selectedComponent]);
    useEffect(() => {
        if (compatibleError && selectedComponent) showNotification("error", compatibleError.data?.message || "Failed to load compatible items");
    }, [compatibleError, selectedComponent]);
    useEffect(() => {
        if (powerSourcesError && selectedComponent) showNotification("error", powerSourcesError.data?.message || "Failed to load power sources");
    }, [powerSourcesError, selectedComponent]);


    // Notification handler
    const showNotification = (type, message, action = null) => setNotification({show: true, type, message, action});

    const handleConfirmAction = async () => {
        if (notification.action) {
            const {callback} = notification.action;
            try {
                await callback();
                if (notification.action.successMessage) showNotification("success", notification.action.successMessage);
            } catch (error) {
                console.error("Error:", error);
                showNotification("error", notification.action.errorMessage || "Error performing action.");
            } finally {
                setNotification(prev => ({...prev, action: null}));
            }
        }
    };


    // Helper functions
    const getItemName = item => item.itemName || item.name || 'Item';
    const getItemPrice = item => item.price || 0;
    const getManufacturer = item => item.manufacturer?.manufacturerName || '';

    const powerSourceComponents = components.filter(c => c.powerSource === true || c.powerSource === "true");
    const otherComponents = components.filter(c => !(c.powerSource === true || c.powerSource === "true"));

    const allOthersSelected = otherComponents.length === selectedItems.filter(item =>
        otherComponents.some(comp => comp.id === item.component?.id)
    ).length;

    // Determine items to show based on selected component
    let baseItemsToShow = [];
    if (selectedComponent) {
        if (selectedComponent.powerSource === true || selectedComponent.powerSource === "true") {
            baseItemsToShow = Array.isArray(compatiblePowerSources) ? compatiblePowerSources : [];
        } else {
            baseItemsToShow = selectedItems.length > 0
                ? compatibleData?.compatibleItems || compatibleData?.items || compatibleData?.data || []
                : allItems;
        }
    }

    const filteredItems = useMemo(() => {
        const currentComponentSelectedItem = selectedItems.find(item => item.component?.id === selectedComponent?.id);
        return baseItemsToShow.filter(item => {
            const itemName = getItemName(item).toLowerCase();
            const manufacturer = getManufacturer(item).toLowerCase();
            const searchLower = itemSearchTerm.toLowerCase();
            const matchesSearch = itemName.includes(searchLower) || manufacturer.includes(searchLower);
            const isCurrentSelectedItem = currentComponentSelectedItem && currentComponentSelectedItem.id === item.id;
            return matchesSearch && !isCurrentSelectedItem;
        });
    }, [baseItemsToShow, itemSearchTerm, selectedItems, selectedComponent]);

    const getSelectedItem = componentId => selectedItems.find(item => item.component?.id === componentId);

    const handleAddItem = item => {
        const newItem = {
            ...item,
            component: {
                id: item.component?.id || selectedComponent?.id,
                componentName: item.component?.componentName || selectedComponent?.componentName
            }
        };
        setSelectedItems(prev => [...prev.filter(s => s.component?.id !== newItem.component?.id), newItem]);
        setSelectedComponent(null);
        setItemSearchTerm('');
    };

    const handleRemoveItem = componentId => setSelectedItems(prev => prev.filter(item => item.component?.id !== componentId));
    const handleClearAll = () => {
        setSelectedItems([]);
        setSelectedComponent(null);
        setItemSearchTerm('');
    };
    const totalPrice = selectedItems.reduce((sum, item) => sum + getItemPrice(item), 0);

    const isLoadingItems = selectedComponent?.powerSource === true || selectedComponent?.powerSource === "true"
        ? loadingPowerSources
        : loadingAllItems || (loadingCompatible && selectedItems.length > 0);

    // Check unauthorized
    const isUnauthorized = () => {
        const errors = [
            powerSourcesError,
            componentsError,
            allItemsError,
            compatibleError];
        return errors.some(err => err?.isUnauthorized);
    };

    if (isUnauthorized()) {
        return <Unauthorized/>;
    }

    if (loadingComponents) return (
        <div className="container mx-auto p-4 text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading components...</p>
        </div>
    );

    return (
        <div className="container mx-auto p-4 space-y-6">
            {!allOthersSelected && powerSourceComponents.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    <div className="flex items-center gap-2">
                        <span>🔒</span>
                        <span>Power source components will appear after selecting all other components</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Components Grid */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg border p-4">
                        <div className="overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                {/* Show other components first */}
                                {otherComponents.map(comp => {
                                    const selectedItem = getSelectedItem(comp.id);
                                    const isSelected = selectedComponent?.id === comp.id;

                                    return (
                                        <div
                                            key={comp.id}
                                            className={`border rounded-lg p-4 cursor-pointer transition-all min-h-[100px] ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : selectedItem
                                                        ? 'border-green-400 bg-green-50'
                                                        : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                            onClick={() => {
                                                setSelectedComponent(comp);
                                                setItemSearchTerm('');
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-800">{comp.componentName}</h3>
                                                    {selectedItem ? (
                                                        <div className="mt-2">
                                                            <h4 className="font-medium text-green-700 text-sm">
                                                                {getItemName(selectedItem)}
                                                            </h4>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <div className="text-xs text-gray-600">
                                                                    {getManufacturer(selectedItem)}
                                                                </div>
                                                                <div className="font-bold text-blue-600 text-sm">
                                                                    Rs {getItemPrice(selectedItem).toFixed(2)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 mt-2">Click to select</p>
                                                    )}
                                                </div>
                                                {selectedItem ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveItem(comp.id);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 ml-2"
                                                    >
                                                        ✕
                                                    </button>
                                                ) : (
                                                    <span className="text-blue-600 font-bold text-lg">+</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Show power source components only when all others are selected */}
                                {allOthersSelected && powerSourceComponents.map(comp => {
                                    const selectedItem = getSelectedItem(comp.id);
                                    const isSelected = selectedComponent?.id === comp.id;

                                    return (
                                        <div
                                            key={comp.id}
                                            className={`border rounded-lg p-4 cursor-pointer transition-all min-h-[100px] ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : selectedItem
                                                        ? 'border-green-400 bg-green-50'
                                                        : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                            onClick={() => {
                                                setSelectedComponent(comp);
                                                setItemSearchTerm('');
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-gray-800">{comp.componentName}</h3>
                                                        <span
                                                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                                            Power
                                                        </span>
                                                    </div>
                                                    {selectedItem ? (
                                                        <div className="mt-2">
                                                            <h4 className="font-medium text-green-700 text-sm">
                                                                {getItemName(selectedItem)}
                                                            </h4>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <div className="text-xs text-gray-600">
                                                                    {getManufacturer(selectedItem)}
                                                                </div>
                                                                <div className="font-bold text-blue-600 text-sm">
                                                                    Rs {getItemPrice(selectedItem).toFixed(2)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 mt-2">Click to select</p>
                                                    )}
                                                </div>
                                                {selectedItem ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveItem(comp.id);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 ml-2"
                                                    >
                                                        ✕
                                                    </button>
                                                ) : (
                                                    <span className="text-blue-600 font-bold text-lg">+</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {components.length === 0 && (
                                <div className="text-center py-8 text-gray-500">No components found</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Items List and Build Total */}
                <div className="space-y-4">
                    {selectedComponent ? (
                        <div className="bg-white rounded-lg border p-4 h-[500px] flex flex-col">
                            <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{selectedComponent.componentName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                selectedComponent.powerSource === true || selectedComponent.powerSource === "true"
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : selectedItems.length > 0
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {selectedComponent.powerSource === true || selectedComponent.powerSource === "true"
                                                    ? 'Compatible Power Sources'
                                                    : selectedItems.length > 0
                                                        ? 'Compatibility Mode'
                                                        : 'All Items'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedComponent(null);
                                            setItemSearchTerm('');
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={`Search ${selectedItems.length > 0 ? 'compatible ' : ''}items...`}
                                        className="w-full pl-4 pr-10 py-2 border rounded text-sm"
                                        value={itemSearchTerm}
                                        onChange={(e) => setItemSearchTerm(e.target.value)}
                                    />
                                    {itemSearchTerm && (
                                        <button
                                            onClick={() => setItemSearchTerm('')}
                                            className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isLoadingItems && (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <div
                                            className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <p className="mt-2 text-sm text-gray-600">
                                            {selectedComponent.powerSource === true || selectedComponent.powerSource === "true"
                                                ? 'Finding compatible power sources...'
                                                : 'Loading items...'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!isLoadingItems && filteredItems.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="text-center text-gray-500 mb-3">
                                        {itemSearchTerm
                                            ? 'No items match your search'
                                            : selectedComponent.powerSource === true || selectedComponent.powerSource === "true"
                                                ? 'No compatible power sources found'
                                                : 'No items available'
                                        }
                                    </div>
                                    {itemSearchTerm && (
                                        <button
                                            onClick={() => setItemSearchTerm('')}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                        >
                                            Clear Search
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                    <div className="text-xs text-gray-500 mb-2 px-1">
                                        {filteredItems.length} {selectedComponent.powerSource === true || selectedComponent.powerSource === "true" ? 'power source' : 'item'}{filteredItems.length !== 1 ? 's' : ''} found
                                    </div>
                                    {filteredItems.map(item => {
                                        const isSelected = selectedItems.some(selected => selected.id === item.id);
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => !isSelected && handleAddItem(item)}
                                                disabled={isSelected}
                                                className={`w-full text-left p-3 border rounded transition-all ${
                                                    isSelected ? 'bg-green-50 border-green-300' : 'hover:bg-blue-50 border-gray-200'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className={`font-medium text-sm ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
                                                            {getItemName(item)}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span
                                                                className="text-xs text-gray-500">{getManufacturer(item)}</span>
                                                            <span className="text-sm font-bold text-blue-600">
                                                                Rs {getItemPrice(item).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {selectedItems.length > 0 && !isSelected && selectedComponent.powerSource !== true && selectedComponent.powerSource !== "true" &&
                                                        <span className="text-green-600 text-sm ml-2">✓</span>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            className="bg-white rounded-lg border p-6 text-center h-[500px] flex flex-col items-center justify-center">
                            <h2 className="font-bold text-gray-700 mb-2">Select a Component</h2>
                            <p className="text-gray-500">Click on any component to view available items</p>
                        </div>
                    )}

                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="font-bold text-gray-800">Build Total</h2>
                                <p className="text-sm text-gray-500">
                                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                                </p>
                            </div>
                            <div className="text-xl font-bold text-green-600">Rs {totalPrice.toFixed(2)}</div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t">
                            <button
                                onClick={handleClearAll}
                                disabled={selectedItems.length === 0}
                                className={`px-4 py-2 border rounded text-sm ${
                                    selectedItems.length > 0
                                        ? 'border-red-300 text-red-600 hover:bg-red-50'
                                        : 'border-gray-300 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Clear Build
                            </button>
                            <button
                                onClick={() => {
                                    if (selectedItems.length > 0) {
                                        // Invoice functionality would go here
                                        console.log("Invoice for", selectedItems.length, "items. Total:", totalPrice);
                                    }
                                }}
                                disabled={selectedItems.length === 0}
                                className={`px-6 py-2 rounded text-sm font-medium ${
                                    selectedItems.length > 0
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Invoice
                            </button>
                        </div>
                    </div>
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
                isActionLoading={false}
            />
        </div>
    );
};

export default BuildCart;