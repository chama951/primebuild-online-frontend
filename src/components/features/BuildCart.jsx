import React, { useState, useMemo, useEffect } from 'react';
import { useGetBuildComponentsQuery } from '../../features/components/componentApi.js';
import { useGetItemsByComponentIdQuery } from "../../features/components/itemApi.js";
import { useGetCompatibleItemsByComponentQuery } from '../../features/components/compatibilityApi';
import { useCreateInvoiceMutation } from '../../features/components/InvoiceApi.js';
import NotificationDialogs from '../common/NotificationDialogs.jsx'; // adjust path if needed

const BuildCart = ({ refetchFlag, resetFlag }) => {
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemSearchTerm, setItemSearchTerm] = useState('');
    const [itemQuantities, setItemQuantities] = useState({});
    const [notification, setNotification] = useState({
        show: false,
        type: '',
        message: '',
        action: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // API hooks with refetch
    const {
        data: components = [],
        isLoading: loadingComponents,
        refetch: refetchComponents
    } = useGetBuildComponentsQuery(true);

    const {
        data: allItems = [],
        isLoading: loadingAllItems,
        refetch: refetchItems
    } = useGetItemsByComponentIdQuery(
        selectedComponent?.id,
        { skip: !selectedComponent }
    );

    const {
        data: compatibleData = {},
        isLoading: loadingCompatible,
        refetch: refetchCompatible
    } = useGetCompatibleItemsByComponentQuery(
        selectedComponent && selectedItems.length > 0 ? {
            componentId: selectedComponent.id,
            selectedItems
        } : null,
        { skip: !selectedComponent || selectedItems.length === 0 }
    );

    const [createInvoice] = useCreateInvoiceMutation();

    // Refetch all data when component loads or refetchFlag changes
    useEffect(() => {
        const refetchAll = async () => {
            try {
                await refetchComponents();
                if (selectedComponent) {
                    await refetchItems();
                    if (selectedItems.length > 0) {
                        await refetchCompatible();
                    }
                }
            } catch (error) {
                console.error("Error refetching data:", error);
            } finally {
                // Reset the flag if provided
                if (resetFlag) {
                    resetFlag();
                }
            }
        };

        refetchAll();
    }, [refetchFlag, selectedComponent?.id, selectedItems.length]); // Dependencies

    // Refetch when component changes
    useEffect(() => {
        if (selectedComponent) {
            refetchItems();
        }
    }, [selectedComponent?.id]);

    // Refetch compatible items when selection changes
    useEffect(() => {
        if (selectedComponent && selectedItems.length > 0) {
            refetchCompatible();
        }
    }, [selectedItems.length, selectedComponent?.id]);

    const getItemName = (item) => item.itemName || item.name || 'Item';
    const getItemPrice = (item) => item.price || 0;
    const getManufacturer = (item) => item.manufacturer?.manufacturerName || '';

    const showCompatible = selectedItems.length > 0;

    let baseItemsToShow = [];
    if (showCompatible) {
        if (Array.isArray(compatibleData)) {
            baseItemsToShow = compatibleData;
        } else if (compatibleData.data && Array.isArray(compatibleData.data)) {
            baseItemsToShow = compatibleData.data;
        } else if (compatibleData.compatibleItems && Array.isArray(compatibleData.compatibleItems)) {
            baseItemsToShow = compatibleData.compatibleItems;
        } else if (compatibleData.items && Array.isArray(compatibleData.items)) {
            baseItemsToShow = compatibleData.items;
        }

        baseItemsToShow.forEach(item => {
            if (!itemQuantities[item.id]) {
                setItemQuantities(prev => ({
                    ...prev,
                    [item.id]: 1
                }));
            }
        });
    } else {
        baseItemsToShow = allItems;
    }

    const filteredItems = useMemo(() =>
            baseItemsToShow.filter(item => {
                const itemName = getItemName(item).toLowerCase();
                const manufacturer = getManufacturer(item).toLowerCase();
                const searchLower = itemSearchTerm.toLowerCase();
                return itemName.includes(searchLower) || manufacturer.includes(searchLower);
            }),
        [baseItemsToShow, itemSearchTerm]
    );

    const getSelectedItem = (componentId) => selectedItems.find(item => item.component?.id === componentId);

    const handleAddItem = (item) => {
        const selectedQuantity = itemQuantities[item.id] || 1;

        const newItem = {
            ...item,
            selectedQuantity,
            component: {
                id: item.component?.id || selectedComponent?.id,
                componentName: item.component?.componentName || selectedComponent?.componentName
            }
        };

        setSelectedItems(prev => {
            const filtered = prev.filter(selected => selected.component?.id !== newItem.component?.id);
            return [...filtered, newItem];
        });

        setSelectedComponent(null);
        setItemSearchTerm('');
    };

    const handleQuantityChange = (itemId, value, maxQuantity) => {
        const newQuantity = Math.max(1, Math.min(parseInt(value) || 1, maxQuantity));
        setItemQuantities(prev => ({
            ...prev,
            [itemId]: newQuantity
        }));
    };

    const handleRemoveItem = (componentId) => {
        setSelectedItems(prev => prev.filter(item => item.component?.id !== componentId));
    };

    const handleClearAll = () => {
        setSelectedItems([]);
        setSelectedComponent(null);
        setItemSearchTerm('');
        setItemQuantities({});
    };

    const handleConfirmAction = () => {
        // Placeholder for error action handling
        console.log('Error action executed');
    };

    const handleCompleteInvoice = async () => {
        if (selectedItems.length === 0) {
            setNotification({
                show: true,
                type: 'error',
                message: 'Please select at least one item to create an invoice.',
            });
            return;
        }

        setIsSubmitting(true);
        const body = {
            invoiceStatus: "NOT_PAID",
            itemList: selectedItems.map(item => ({
                id: item.id,
                quantity: (item.selectedQuantity || 1).toString()
            }))
        };

        try {
            const response = await createInvoice(body).unwrap();
            setNotification({
                show: true,
                type: 'success',
                message: 'Invoice created successfully!',
            });
            handleClearAll();
            console.log("Invoice response:", response);

            // Refetch data after successful invoice creation
            await refetchComponents();
            if (selectedComponent) {
                await refetchItems();
            }
        } catch (error) {
            setNotification({
                show: true,
                type: 'error',
                message: error?.data?.message || "Failed to create invoice",
            });
            console.error("Invoice creation failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPrice = selectedItems.reduce((sum, item) =>
        sum + (getItemPrice(item) * (item.selectedQuantity || 1)), 0
    );

    const totalItemsCount = selectedItems.reduce((sum, item) => sum + (item.selectedQuantity || 1), 0);

    if (loadingComponents) {
        return (
            <div className="container mx-auto p-4">
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading components...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 space-y-6">
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() =>
                    setNotification({ show: false, type: "", message: "", action: null })
                }
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() =>
                    setNotification({ show: false, type: "", message: "", action: null })
                }
                errorMessage={notification.message}
                errorAction={notification.action}
                onErrorAction={handleConfirmAction}
                isActionLoading={isSubmitting}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Components Grid - More Compact Cards */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg border p-3">
                        <div className="overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                                {components.map(comp => {
                                    const selectedItem = getSelectedItem(comp.id);
                                    const isSelected = selectedComponent?.id === comp.id;

                                    return (
                                        <div
                                            key={comp.id}
                                            className={`border rounded-lg p-3 cursor-pointer transition-all ${
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
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-800 text-sm">{comp.componentName}</h3>
                                                    {selectedItem ? (
                                                        <div className="mt-1">
                                                            <h4 className="font-medium text-green-700 text-xs truncate">
                                                                {getItemName(selectedItem)}
                                                            </h4>
                                                            <div className="flex items-center justify-between mt-0.5">
                                                                <span className="text-[10px] text-gray-500">
                                                                    {getManufacturer(selectedItem)}
                                                                </span>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs font-bold text-blue-600">
                                                                        Rs {getItemPrice(selectedItem).toFixed(2)}
                                                                    </span>
                                                                    {selectedItem.selectedQuantity > 1 && (
                                                                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded">
                                                                            x{selectedItem.selectedQuantity}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] text-gray-400 mt-1">Click to select</p>
                                                    )}
                                                </div>
                                                {selectedItem ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveItem(comp.id);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 text-xs ml-1 flex-shrink-0 w-4 h-4 flex items-center justify-center"
                                                    >
                                                        ✕
                                                    </button>
                                                ) : (
                                                    <span className="text-blue-600 font-bold text-sm flex-shrink-0">+</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {components.length === 0 && (
                                <div className="text-center py-6 text-gray-500 text-sm">No components found</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Items List */}
                <div className="space-y-4">
                    {selectedComponent ? (
                        <div className="bg-white rounded-lg border p-4 h-[500px] flex flex-col">
                            <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{selectedComponent.componentName}</h3>
                                        {showCompatible && (
                                            <span className="inline-block mt-1 text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                                Compatibility Mode
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => { setSelectedComponent(null); setItemSearchTerm(''); }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    className="w-full px-3 py-2 border rounded text-sm"
                                    value={itemSearchTerm}
                                    onChange={(e) => setItemSearchTerm(e.target.value)}
                                />
                            </div>

                            {(loadingAllItems || (loadingCompatible && showCompatible)) && (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <p className="mt-2 text-sm text-gray-600">
                                            {showCompatible ? 'Checking compatibility...' : 'Loading items...'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!loadingAllItems && !(loadingCompatible && showCompatible) && (
                                filteredItems.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-gray-500">
                                        {itemSearchTerm ? 'No items match your search' : showCompatible ? 'No compatible items found' : 'No items available'}
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                        {filteredItems.map(item => {
                                            const isSelected = selectedItems.some(selected => selected.id === item.id);
                                            const maxQuantity = item.quantity || 0;
                                            const isOutOfStock = maxQuantity <= 0;

                                            return (
                                                <div key={item.id} className={`p-3 border rounded ${
                                                    isSelected ? 'bg-green-50 border-green-300' : isOutOfStock ? 'bg-gray-50 border-gray-200 opacity-60' : 'border-gray-200 hover:bg-blue-50'
                                                }`}>
                                                    <div className="mb-2">
                                                        <h4 className={`font-medium text-sm ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
                                                            {item.itemName}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500">{item.manufacturer?.manufacturerName}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-blue-600">Rs {item.price?.toFixed(2)}</span>
                                                        <div>
                                                            {showCompatible && !isSelected && !isOutOfStock && (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max={maxQuantity}
                                                                        value={itemQuantities[item.id] || 1}
                                                                        onChange={(e) => handleQuantityChange(item.id, e.target.value, maxQuantity)}
                                                                        className="w-16 border rounded px-2 py-1 text-sm text-center"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                    <button
                                                                        onClick={() => handleAddItem(item)}
                                                                        className="px-3 py-1 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
                                                                    >
                                                                        Add
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {!showCompatible && !isSelected && !isOutOfStock && (
                                                                <button onClick={() => handleAddItem(item)} className="px-3 py-1 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap">
                                                                    Add
                                                                </button>
                                                            )}

                                                            {isSelected && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-green-600 font-medium">Added</span>
                                                                    {selectedItems.find(si => si.id === item.id)?.selectedQuantity > 1 && (
                                                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                            Qty: {selectedItems.find(si => si.id === item.id)?.selectedQuantity}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {isOutOfStock && <span className="text-sm text-red-600 font-medium">Out of Stock</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border p-6 text-center h-[500px] flex items-center justify-center">
                            <div>
                                <h2 className="font-bold text-gray-700 mb-2">Select a Component</h2>
                                <p className="text-gray-500">Click on any component to view available items</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Build Total Section - Single Row */}
            <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="font-bold text-gray-800 text-lg">Build Total</h2>
                        <p className="text-sm text-gray-500">{totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''} selected</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-2xl font-bold text-green-600">Rs {totalPrice.toFixed(2)}</div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleClearAll}
                                className={`px-6 py-2.5 border rounded text-sm font-medium transition-colors ${
                                    selectedItems.length > 0
                                        ? 'border-red-300 text-red-600 hover:bg-red-50'
                                        : 'border-gray-300 text-gray-400 cursor-not-allowed'
                                }`}
                                disabled={selectedItems.length === 0}
                            >
                                Clear Build
                            </button>
                            <button
                                onClick={handleCompleteInvoice}
                                className={`px-8 py-2.5 rounded text-sm font-medium transition-colors ${
                                    selectedItems.length > 0
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                                disabled={selectedItems.length === 0}
                            >
                                Create Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuildCart;