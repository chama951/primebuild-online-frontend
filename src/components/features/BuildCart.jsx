import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useGetBuildComponentsQuery } from '../../features/components/componentApi.js';
import { useGetItemsByComponentIdQuery } from "../../features/components/itemApi.js";
import {
    useGetCompatibleItemsByComponentQuery,
    useGetCompatiblePowerSourcesQuery
} from '../../features/components/compatibilityApi';
import { useCreateInvoiceMutation } from '../../features/components/InvoiceApi.js';
import NotificationDialogs from '../common/NotificationDialogs.jsx';

const isPowerSourceComp = (comp) =>
    comp?.componentType === 'POWER_SOURCE' ||
    comp?.type === 'POWER_SOURCE' ||
    comp?.componentName?.toLowerCase().includes('power') ||
    comp?.componentName?.toLowerCase().includes('psu') ||
    comp?.category?.toLowerCase().includes('power');

const BuildCart = ({ refetchFlag, resetFlag }) => {
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemSearchTerm, setItemSearchTerm] = useState('');
    const [itemQuantities, setItemQuantities] = useState({});
    const [notification, setNotification] = useState({ show: false, type: '', message: '', action: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: components = [], isLoading: loadingComponents, refetch: refetchComponents } = useGetBuildComponentsQuery(true);

    const { powerSourceComponents, otherComponents } = useMemo(() => ({
        powerSourceComponents: components.filter(isPowerSourceComp),
        otherComponents: components.filter(c => !isPowerSourceComp(c))
    }), [components]);

    const allOtherComponentsSelected = useMemo(() =>
        otherComponents.length === 0 || otherComponents.every(comp =>
            selectedItems.some(item => item.component?.id === comp.id)
        ), [otherComponents, selectedItems]);

    const selectedPowerSource = useMemo(() =>
            selectedItems.find(item => powerSourceComponents.some(comp => comp.id === item.component?.id))
        , [selectedItems, powerSourceComponents]);

    const isPowerSourceEnabled = allOtherComponentsSelected && otherComponents.length > 0;

    const canCreateInvoice = useMemo(() =>
            selectedItems.length > 0 && allOtherComponentsSelected &&
            (powerSourceComponents.length === 0 || selectedPowerSource)
        , [selectedItems, allOtherComponentsSelected, powerSourceComponents.length, selectedPowerSource]);

    const { data: allItems = [], isLoading: loadingAllItems, refetch: refetchItems } = useGetItemsByComponentIdQuery(
        selectedComponent?.id, { skip: !selectedComponent }
    );

    const isPowerSource = useMemo(() => isPowerSourceComp(selectedComponent), [selectedComponent]);

    const compatibilityHook = isPowerSource ? useGetCompatiblePowerSourcesQuery : useGetCompatibleItemsByComponentQuery;
    const { data: compatibleData = {}, isLoading: loadingCompatible, refetch: refetchCompatible } = compatibilityHook(
        selectedComponent && selectedItems.length > 0 ? {
            componentId: selectedComponent.id,
            selectedItems: selectedItems.map(({ id, selectedQuantity = 1, ...item }) => ({ id, quantity: selectedQuantity, ...item }))
        } : null,
        { skip: !selectedComponent || selectedItems.length === 0 }
    );

    // Refetch all data on component mount and when refetchFlag changes
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                await refetchComponents();
                if (selectedComponent) {
                    await refetchItems();
                    if (selectedItems.length > 0) await refetchCompatible();
                }
            } catch (error) {
                console.error("Error refetching data:", error);
            } finally {
                if (resetFlag) resetFlag();
            }
        };

        fetchAllData();
    }, [refetchFlag]); // Also runs on mount because refetchFlag might change

    // Force refetch when component mounts even if refetchFlag doesn't change
    useEffect(() => {
        refetchComponents();
    }, []); // Empty dependency array = on mount

    useEffect(() => {
        if (selectedComponent) {
            refetchItems();
            setItemQuantities({});
        }
    }, [selectedComponent?.id]);

    useEffect(() => {
        if (selectedComponent && selectedItems.length > 0) refetchCompatible();
    }, [selectedItems.length]);

    useEffect(() => {
        if (selectedPowerSource && otherComponents.length > 0) {
            const powerSourceComp = powerSourceComponents.find(c => c.id === selectedPowerSource.component?.id);
            if (powerSourceComp) {
                setSelectedComponent(powerSourceComp);
                setTimeout(() => setSelectedComponent(null), 100);
            }
        }
    }, [otherComponents.length, selectedItems.filter(i => !powerSourceComponents.some(c => c.id === i.component?.id)).length]);

    const [createInvoice] = useCreateInvoiceMutation();

    const getItemName = (item) => item.itemName || item.name || 'Item';
    const getItemPrice = (item) => item.price || 0;
    const getManufacturer = (item) => item.manufacturer?.manufacturerName || '';
    const getItemQuantity = (item) => item.quantity || item.stock || 0;
    const getSelectedItem = (componentId) => selectedItems.find(item => item.component?.id === componentId);

    const showCompatible = selectedItems.length > 0;
    let baseItemsToShow = showCompatible
        ? (compatibleData.data || compatibleData.compatibleItems || compatibleData.items || compatibleData.powerSources || compatibleData)
        : allItems;

    if (!Array.isArray(baseItemsToShow)) baseItemsToShow = [];

    if (showCompatible) {
        baseItemsToShow.forEach(item => { if (!itemQuantities[item.id]) setItemQuantities(p => ({ ...p, [item.id]: 1 })); });
    }

    const filteredItems = useMemo(() =>
        baseItemsToShow.filter(item => {
            const search = itemSearchTerm.toLowerCase();
            return getItemName(item).toLowerCase().includes(search) || getManufacturer(item).toLowerCase().includes(search);
        }), [baseItemsToShow, itemSearchTerm]);

    const isComponentDisabled = useCallback((comp) =>
            powerSourceComponents.some(c => c.id === comp.id) && !isPowerSourceEnabled
        , [powerSourceComponents, isPowerSourceEnabled]);

    const handleAddItem = (item) => {
        const newItem = {
            ...item,
            selectedQuantity: itemQuantities[item.id] || 1,
            component: {
                id: item.component?.id || selectedComponent?.id,
                componentName: item.component?.componentName || selectedComponent?.componentName,
                componentType: item.component?.componentType || selectedComponent?.componentType
            }
        };
        setSelectedItems(prev => {
            const filtered = prev.filter(s => s.component?.id !== newItem.component?.id);
            if (isPowerSource) return [...filtered.filter(s => !powerSourceComponents.some(c => c.id === s.component?.id)), newItem];
            return [...filtered, newItem];
        });
        setSelectedComponent(null);
        setItemSearchTerm('');
    };

    const handleQuantityChange = (id, value, max) => setItemQuantities(p => ({ ...p, [id]: Math.max(1, Math.min(parseInt(value) || 1, max)) }));
    const handleRemoveItem = (componentId) => setSelectedItems(prev => prev.filter(item => item.component?.id !== componentId));
    const handleClearAll = () => {
        setSelectedItems([]);
        setSelectedComponent(null);
        setItemSearchTerm('');
        setItemQuantities({});
    };

    const handleCompleteInvoice = async () => {
        if (!canCreateInvoice) {
            let message = 'Please complete your build:';
            if (!allOtherComponentsSelected) message += ' Select all required components';
            else if (powerSourceComponents.length > 0 && !selectedPowerSource) message += ' Select a power source';
            setNotification({ show: true, type: 'error', message });
            return;
        }
        setIsSubmitting(true);
        try {
            await createInvoice({
                invoiceStatus: "NOT_PAID",
                itemList: selectedItems.map(item => ({ id: item.id, quantity: (item.selectedQuantity || 1).toString() }))
            }).unwrap();
            setNotification({ show: true, type: 'success', message: 'Invoice created successfully!' });
            handleClearAll();
            await refetchComponents();
            if (selectedComponent) await refetchItems();
        } catch (error) {
            setNotification({ show: true, type: 'error', message: error?.data?.message || "Failed to create invoice" });
        } finally { setIsSubmitting(false); }
    };

    const totalPrice = selectedItems.reduce((sum, item) => sum + (getItemPrice(item) * (item.selectedQuantity || 1)), 0);
    const totalItemsCount = selectedItems.reduce((sum, item) => sum + (item.selectedQuantity || 1), 0);
    const selectedOtherCount = otherComponents.filter(comp => selectedItems.some(item => item.component?.id === comp.id)).length;

    if (loadingComponents) return (
        <div className="container mx-auto p-4">
            <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading components...</p>
            </div>
        </div>
    );

    const ComponentCard = ({ comp, isPower = false }) => {
        const selectedItem = getSelectedItem(comp.id);
        const isSelected = selectedComponent?.id === comp.id;
        const disabled = isPower && isComponentDisabled(comp);

        return (
            <div className={`border rounded-lg p-3 transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' :
                isSelected ? 'border-blue-500 bg-blue-50 cursor-pointer' :
                    selectedItem ? 'border-green-400 bg-green-50 cursor-pointer' : 'border-gray-200 hover:border-blue-300 cursor-pointer'}`}
                 onClick={() => !disabled && (setSelectedComponent(comp), setItemSearchTerm(''))}
                 title={disabled ? 'Select all other components first' : ''}>
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm">
                            {comp.componentName}
                            {isPower && <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">Power</span>}
                        </h3>
                        {selectedItem ? (
                            <div className="mt-1">
                                <h4 className="font-medium text-green-700 text-xs truncate">{getItemName(selectedItem)}</h4>
                                <div className="flex items-center justify-between mt-0.5">
                                    <span className="text-[10px] text-gray-500">{getManufacturer(selectedItem)}</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-bold text-blue-600">Rs {getItemPrice(selectedItem).toFixed(2)}</span>
                                        {selectedItem.selectedQuantity > 1 &&
                                            <span className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded">x{selectedItem.selectedQuantity}</span>}
                                    </div>
                                </div>
                            </div>
                        ) : <p className="text-[10px] text-gray-400 mt-1">{disabled ? 'Locked' : 'Click to select'}</p>}
                    </div>
                    {selectedItem ? (
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveItem(comp.id); }}
                                className="text-red-500 hover:text-red-700 text-xs ml-1 flex-shrink-0 w-4 h-4 flex items-center justify-center">✕</button>
                    ) : (!disabled && <span className="text-blue-600 font-bold text-sm flex-shrink-0">+</span>)}
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({ show: false, type: "", message: "", action: null })}
                errorMessage={notification.message} errorAction={notification.action}
                onErrorAction={() => console.log('Error action executed')} isActionLoading={isSubmitting}
            />

            {otherComponents.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-700">Build Progress</h3>
                        <span className="text-sm text-gray-600">
                            {selectedOtherCount}/{otherComponents.length} Components Selected
                            {powerSourceComponents.length > 0 &&
                                <span className="ml-2 text-xs text-gray-500">{selectedPowerSource ? '✓' : '⏳'} Power Source</span>}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                             style={{ width: `${(selectedOtherCount / otherComponents.length) * 100}%` }}></div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg border p-3">
                        <div className="overflow-y-auto pr-2">
                            {otherComponents.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-gray-500 mb-2 px-1">Required Components</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {otherComponents.map(comp => <ComponentCard key={comp.id} comp={comp} />)}
                                    </div>
                                </div>
                            )}
                            {powerSourceComponents.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 mb-2 px-1">
                                        Power Supply {!isPowerSourceEnabled && '(Select other components first)'}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {powerSourceComponents.map(comp => <ComponentCard key={comp.id} comp={comp} isPower />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {selectedComponent ? (
                        <div className="bg-white rounded-lg border p-4 h-[500px] flex flex-col">
                            <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{selectedComponent.componentName}</h3>
                                        {isPowerSource && <span className="inline-block mt-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Power Source</span>}
                                        {showCompatible && <span className="inline-block mt-1 text-xs px-2 py-1 bg-green-100 text-green-800 rounded ml-2">Compatibility Mode</span>}
                                    </div>
                                    <button onClick={() => { setSelectedComponent(null); setItemSearchTerm(''); }} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <input type="text" placeholder={`Search ${isPowerSource ? 'power sources' : 'items'}...`}
                                       className="w-full px-3 py-2 border rounded text-sm" value={itemSearchTerm}
                                       onChange={(e) => setItemSearchTerm(e.target.value)} />
                            </div>

                            {(loadingAllItems || (loadingCompatible && showCompatible)) ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <p className="mt-2 text-sm text-gray-600">{showCompatible ? 'Checking compatibility...' : 'Loading items...'}</p>
                                    </div>
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                    {itemSearchTerm ? `No ${isPowerSource ? 'power sources' : 'items'} match your search` :
                                        showCompatible ? `No compatible ${isPowerSource ? 'power sources' : 'items'} found` :
                                            `No ${isPowerSource ? 'power sources' : 'items'} available`}
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                    {filteredItems.map(item => {
                                        const isSelected = selectedItems.some(s => s.id === item.id);
                                        const maxQuantity = getItemQuantity(item);
                                        const isOutOfStock = maxQuantity <= 0;
                                        return (
                                            <div key={item.id} className={`p-3 border rounded ${isSelected ? 'bg-green-50 border-green-300' :
                                                isOutOfStock ? 'bg-gray-50 border-gray-200 opacity-60' : 'border-gray-200 hover:bg-blue-50'}`}>
                                                <div className="mb-2">
                                                    <h4 className={`font-medium text-sm ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>{item.itemName}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-500">{item.manufacturer?.manufacturerName}</span>
                                                        {isPowerSource && item.wattage &&
                                                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{item.wattage}W</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-blue-600">Rs {item.price?.toFixed(2)}</span>
                                                    <div>
                                                        {!isSelected && !isOutOfStock && (showCompatible ? (
                                                            <div className="flex items-center gap-2">
                                                                <input type="number" min="1" max={maxQuantity} value={itemQuantities[item.id] || 1}
                                                                       onChange={(e) => handleQuantityChange(item.id, e.target.value, maxQuantity)}
                                                                       className="w-16 border rounded px-2 py-1 text-sm text-center" onClick={(e) => e.stopPropagation()} />
                                                                <button onClick={() => handleAddItem(item)}
                                                                        className="px-3 py-1 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap">Add</button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => handleAddItem(item)}
                                                                    className="px-3 py-1 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap">Add</button>
                                                        ))}
                                                        {isSelected && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-green-600 font-medium">Added</span>
                                                                {selectedItems.find(s => s.id === item.id)?.selectedQuantity > 1 &&
                                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Qty: {selectedItems.find(s => s.id === item.id)?.selectedQuantity}</span>}
                                                            </div>
                                                        )}
                                                        {isOutOfStock && <span className="text-sm text-red-600 font-medium">Out of Stock</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border p-6 text-center h-[500px] flex items-center justify-center">
                            <div>
                                <h2 className="font-bold text-gray-700 mb-2">Select a Component</h2>
                                <p className="text-gray-500">Click on any component to view available items</p>
                                {!canCreateInvoice && selectedItems.length > 0 && (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-left">
                                        <p className="text-sm text-yellow-800 font-medium">Build Incomplete:</p>
                                        <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
                                            {!allOtherComponentsSelected && <li>Select all required components first</li>}
                                            {powerSourceComponents.length > 0 && !selectedPowerSource && allOtherComponentsSelected &&
                                                <li>Select a power source</li>}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="font-bold text-gray-800 text-lg">Build Total</h2>
                        <p className="text-sm text-gray-500">{totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''} selected</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-2xl font-bold text-green-600">Rs {totalPrice.toFixed(2)}</div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleClearAll} disabled={selectedItems.length === 0}
                                    className={`px-6 py-2.5 border rounded text-sm font-medium transition-colors ${
                                        selectedItems.length > 0 ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-gray-300 text-gray-400 cursor-not-allowed'}`}>
                                Clear Build
                            </button>
                            <button onClick={handleCompleteInvoice} disabled={!canCreateInvoice || isSubmitting}
                                    className={`px-8 py-2.5 rounded text-sm font-medium transition-colors ${
                                        canCreateInvoice ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                    title={!canCreateInvoice ? 'Complete all selections first' : ''}>
                                {isSubmitting ? 'Creating...' : 'Create Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuildCart;