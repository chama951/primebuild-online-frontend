import React, {useState, useMemo} from 'react';
import {useGetBuildComponentsQuery} from '../../features/components/componentApi.js';
import {useGetItemsByComponentIdQuery} from "../../features/components/itemApi.js";
import {useGetCompatibleItemsByComponentQuery} from '../../features/components/compatibilityApi';

const BuildCart = () => {
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemSearchTerm, setItemSearchTerm] = useState('');

    const {data: components = [], isLoading: loadingComponents} = useGetBuildComponentsQuery(true);

    // Get items for selected component
    const {data: allItems = [], isLoading: loadingAllItems} = useGetItemsByComponentIdQuery(
        selectedComponent?.id,
        {skip: !selectedComponent}
    );

    // Get compatible items
    const {data: compatibleData = {}, isLoading: loadingCompatible} = useGetCompatibleItemsByComponentQuery(
        selectedComponent && selectedItems.length > 0 ? {
            componentId: selectedComponent.id,
            selectedItems
        } : null,
        {skip: !selectedComponent || selectedItems.length === 0}
    );

    // Helper functions
    const getItemName = (item) => item.itemName || item.name || 'Item';
    const getItemPrice = (item) => item.price || 0;
    const getManufacturer = (item) => item.manufacturer?.manufacturerName || '';

    // Determine which items to show and filter them
    const showCompatible = selectedItems.length > 0;

    let baseItemsToShow = [];
    if (showCompatible) {
        if (Array.isArray(compatibleData)) {
            baseItemsToShow = compatibleData;
        } else if (Array.isArray(compatibleData.compatibleItems)) {
            baseItemsToShow = compatibleData.compatibleItems;
        } else if (Array.isArray(compatibleData.items)) {
            baseItemsToShow = compatibleData.items;
        } else if (compatibleData.data && Array.isArray(compatibleData.data)) {
            baseItemsToShow = compatibleData.data;
        }
    } else {
        baseItemsToShow = allItems;
    }

    // Filter items by search term
    const filteredItems = useMemo(() =>
            baseItemsToShow.filter(item => {
                const itemName = getItemName(item).toLowerCase();
                const manufacturer = getManufacturer(item).toLowerCase();
                const searchLower = itemSearchTerm.toLowerCase();

                return itemName.includes(searchLower) ||
                    manufacturer.includes(searchLower);
            }),
        [baseItemsToShow, itemSearchTerm]
    );

    // Get selected item for a component
    const getSelectedItem = (componentId) => {
        return selectedItems.find(item => item.component?.id === componentId);
    };

    // Add item
    const handleAddItem = (item) => {
        const newItem = {
            ...item,
            component: {
                id: item.component?.id || selectedComponent?.id,
                componentName: item.component?.componentName || selectedComponent?.componentName
            }
        };

        setSelectedItems(prev => {
            const filtered = prev.filter(selected =>
                selected.component?.id !== newItem.component?.id
            );
            return [...filtered, newItem];
        });

        setSelectedComponent(null);
        setItemSearchTerm(''); // Clear item search when item is added
    };

    // Remove item
    const handleRemoveItem = (componentId) => {
        setSelectedItems(prev => prev.filter(item => item.component?.id !== componentId));
    };

    // Clear all items
    const handleClearAll = () => {
        setSelectedItems([]);
        setSelectedComponent(null);
        setItemSearchTerm('');
    };

    // Complete Invoice
    const handleCompleteInvoice = () => {
        if (selectedItems.length === 0) {
            alert('Please select at least one item to complete the invoice.');
            return;
        }
        alert(`Invoice completed for ${selectedItems.length} items. Total: Rs ${totalPrice.toFixed(2)}`);

    };

    // Calculate total
    const totalPrice = selectedItems.reduce((sum, item) => sum + getItemPrice(item), 0);

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
            <h1 className="text-2xl font-bold">PC Builder</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Components Grid */}
                <div className="lg:col-span-2">
                    {/* Components Grid */}
                    <div className="bg-white rounded-lg border p-4">
                        <div className="overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                                {components.map(comp => {
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
                                                setItemSearchTerm(''); // Clear item search when component changes
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
                                                        <p className="text-sm text-gray-500 mt-2">
                                                            Click to select
                                                        </p>
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
                                <div className="text-center py-8 text-gray-500">
                                    No components found
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Items List and Build Total */}
                <div className="space-y-4">
                    {/* Items Selection Panel*/}
                    {selectedComponent ? (
                        <div className="bg-white rounded-lg border p-4 h-[500px] flex flex-col">
                            {/* Header with Search */}
                            <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-800">
                                            {selectedComponent.componentName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                showCompatible
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {showCompatible ? 'Compatibility Mode' : 'All Items'}
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

                                {/* Item Search Bar */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={`Search ${showCompatible ? 'compatible' : ''} items...`}
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

                            {/* Loading States */}
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

                            {/* Items List */}
                            {!loadingAllItems && !(loadingCompatible && showCompatible) && filteredItems.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="text-center text-gray-500 mb-3">
                                        {itemSearchTerm
                                            ? 'No items match your search'
                                            : showCompatible
                                                ? 'No compatible items found'
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
                                        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
                                    </div>
                                    {filteredItems.map(item => {
                                        const isSelected = selectedItems.some(
                                            selected => selected.id === item.id
                                        );

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => !isSelected && handleAddItem(item)}
                                                disabled={isSelected}
                                                className={`w-full text-left p-3 border rounded transition-all ${
                                                    isSelected
                                                        ? 'bg-green-50 border-green-300'
                                                        : 'hover:bg-blue-50 border-gray-200'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className={`font-medium text-sm ${
                                                            isSelected ? 'text-green-700' : 'text-gray-800'
                                                        }`}>
                                                            {isSelected ? '✓ ' : ''}{getItemName(item)}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500">
                                                                {getManufacturer(item)}
                                                            </span>
                                                            <span className="text-sm font-bold text-blue-600">
                                                                Rs {getItemPrice(item).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {showCompatible && !isSelected && (
                                                        <span className="text-green-600 text-sm ml-2">✓</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border p-6 text-center h-[500px] flex flex-col items-center justify-center">
                            <h2 className="font-bold text-gray-700 mb-2">Select a Component</h2>
                            <p className="text-gray-500">
                                Click on any component to view available items
                            </p>
                        </div>
                    )}

                    {/* Build Total Card */}
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="font-bold text-gray-800">Build Total</h2>
                                <p className="text-sm text-gray-500">
                                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-green-600">
                                    Rs {totalPrice.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                            <button
                                onClick={handleClearAll}
                                className={`px-4 py-2 border rounded text-sm transition-colors ${
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
                                className={`px-6 py-2 rounded text-sm font-medium transition-colors ${
                                    selectedItems.length > 0
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                                disabled={selectedItems.length === 0}
                            >
                                Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuildCart;