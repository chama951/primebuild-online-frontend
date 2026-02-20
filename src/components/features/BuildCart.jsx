import React, {useState, useMemo, useEffect} from 'react';
import {useGetBuildComponentsQuery} from '../../features/components/componentApi.js';
import {useGetItemsByComponentIdQuery} from "../../features/components/itemApi.js";
import {
    useGetCompatibleItemsByComponentQuery,
    useGetCompatiblePowerSourcesQuery
} from '../../features/components/compatibilityApi';
import {
    useCreateBuildMutation,
    useUpdateBuildMutation,
    useDeleteBuildMutation,
    useGetCurrentUserBuildsQuery
} from '../../features/components/buildApi';
import {useCreateInvoiceMutation} from '../../features/components/invoiceApi';
import NotificationDialogs from '../common/NotificationDialogs.jsx';

const isPowerSourceComp = (comp) => comp?.powerSource === true;

const BuildCart = () => {
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemSearchTerm, setItemSearchTerm] = useState('');
    const [itemQuantities, setItemQuantities] = useState({});
    const [notification, setNotification] = useState({show: false, type: '', message: ''});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentBuildId, setCurrentBuildId] = useState(null);
    const [buildName, setBuildName] = useState('');

    const {
        data: components = [],
        isLoading: loadingComponents
    } = useGetBuildComponentsQuery(true, {refetchOnMountOrArgChange: true});
    const {
        data: userBuilds = [],
        refetch: refetchUserBuilds
    } = useGetCurrentUserBuildsQuery(undefined, {refetchOnMountOrArgChange: true});

    const [createBuild] = useCreateBuildMutation();
    const [updateBuild] = useUpdateBuildMutation();
    const [deleteBuild] = useDeleteBuildMutation();
    const [createInvoice] = useCreateInvoiceMutation();

    const otherComponents = useMemo(() => components.filter(c => !isPowerSourceComp(c)), [components]);
    const powerSourceComponents = useMemo(() => components.filter(isPowerSourceComp), [components]);

    const allOtherComponentsSelected = useMemo(() =>
            otherComponents.every(comp => selectedItems.some(item => item.component?.id === comp.id)),
        [otherComponents, selectedItems]
    );

    const isPowerSourceEnabled = allOtherComponentsSelected && powerSourceComponents.length > 0;

    useEffect(() => {
        const build = userBuilds.find(b => b.id === currentBuildId);
        if (build) {
            setBuildName(build.buildName);
            const mapped = build.buildItemList.map(bi => ({
                ...bi.item,
                selectedQuantity: bi.item.component?.powerSource ? 1 : bi.buildQuantity,
                component: bi.item.component
            }));
            setSelectedItems(mapped);
        } else {
            setBuildName('');
            setSelectedItems([]);
        }
    }, [currentBuildId, userBuilds]);

    const {data: allItems = []} = useGetItemsByComponentIdQuery(selectedComponent?.id, {skip: !selectedComponent});

    const compatibilityParams = selectedComponent && selectedItems.length > 0
        ? {componentId: selectedComponent.id, selectedItems}
        : null;
    const {data: compatibleData = []} = useGetCompatibleItemsByComponentQuery(
        compatibilityParams,
        {skip: !selectedComponent || selectedItems.length === 0 || isPowerSourceComp(selectedComponent)}
    );

    const powerSourceParams = isPowerSourceEnabled && selectedItems.length > 0
        ? {componentId: powerSourceComponents[0]?.id, selectedItems}
        : null;
    const {data: compatiblePowerSources = []} = useGetCompatiblePowerSourcesQuery(
        powerSourceParams,
        {skip: !isPowerSourceEnabled}
    );

    const itemsToShow = useMemo(() => {
        if (!selectedComponent) return [];
        if (isPowerSourceComp(selectedComponent)) return compatiblePowerSources;
        return selectedItems.length > 0
            ? Array.isArray(compatibleData) ? compatibleData : compatibleData?.data || []
            : allItems;
    }, [selectedComponent, selectedItems, compatibleData, allItems, compatiblePowerSources]);

    const filteredItems = useMemo(() =>
            itemsToShow.filter(item => (item.itemName || item.name || '').toLowerCase().includes(itemSearchTerm.toLowerCase())),
        [itemsToShow, itemSearchTerm]
    );

    const getItemName = (item) => item.itemName || item.name || 'Item';
    const getItemPrice = (item) => item.price || 0;
    const getSelectedItem = (componentId) => selectedItems.find(item => item.component?.id === componentId);

    const handleAddItem = (item, quantity) => {
        const maxSlots = item.quantity ?? 0;
        if (!isPowerSourceComp(item) && quantity > maxSlots) {
            setNotification({show: true, type: 'error', message: `Only ${maxSlots} items available in slots`});
            return;
        }
        const newItem = {
            ...item,
            selectedQuantity: isPowerSourceComp(item) ? 1 : quantity,
            component: item.component || selectedComponent
        };
        setSelectedItems(prev => [...prev.filter(s => s.component?.id !== newItem.component?.id), newItem]);
        setSelectedComponent(null);
        setItemSearchTerm('');
        setItemQuantities(prev => ({...prev, [item.id]: 1}));
    };

    const handleRemoveItem = (componentId) =>
        setSelectedItems(prev => prev.filter(item => item.component?.id !== componentId));

    const handleClearItems = () => {
        setSelectedItems([]);
        setSelectedComponent(null);
        setItemSearchTerm('');
        setItemQuantities({});
    };

    const handleSaveBuild = async () => {
        if (!buildName.trim()) return setNotification({show: true, type: "error", message: "Enter build name"});
        if (selectedItems.length === 0) return setNotification({
            show: true,
            type: "error",
            message: "Select at least one item"
        });

        setIsSubmitting(true);
        const payload = {
            buildName: buildName.trim(),
            buildStatus: "DRAFT",
            itemList: selectedItems.map(i => ({id: i.id, quantity: i.selectedQuantity.toString()}))
        };

        try {
            if (currentBuildId) await updateBuild({id: currentBuildId, ...payload}).unwrap();
            else {
                const res = await createBuild(payload).unwrap();
                setCurrentBuildId(res.id);
            }
            setNotification({show: true, type: "success", message: "Build saved successfully!"});
            refetchUserBuilds();
        } catch (err) {
            setNotification({show: true, type: "error", message: err?.data?.message || "Failed to save build"});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBuild = async () => {
        if (!currentBuildId) return;
        setIsSubmitting(true);
        try {
            await deleteBuild(currentBuildId).unwrap();
            setNotification({show: true, type: "success", message: "Build deleted successfully!"});
            setCurrentBuildId(null);
            setBuildName('');
            setSelectedItems([]);
            refetchUserBuilds();
        } catch (err) {
            setNotification({show: true, type: "error", message: err?.data?.message || "Failed to delete build"});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateInvoice = async () => {
        if (!buildName.trim()) return setNotification({
            show: true,
            type: "error",
            message: "Enter build name before invoicing"
        });
        if (selectedItems.length === 0) return setNotification({
            show: true,
            type: "error",
            message: "Select at least one item before invoicing"
        });

        setIsSubmitting(true);
        try {
            if (!currentBuildId) {
                const payload = {
                    buildName: buildName.trim(),
                    buildStatus: "DRAFT",
                    itemList: selectedItems.map(i => ({id: i.id, quantity: i.selectedQuantity.toString()}))
                };
                const res = await createBuild(payload).unwrap();
                setCurrentBuildId(res.id);
            }

            const invoicePayload = {
                invoiceStatus: "NOT_PAID",
                itemList: selectedItems.map(i => ({id: i.id, quantity: i.selectedQuantity.toString()}))
            };
            await createInvoice(invoicePayload).unwrap();
            setNotification({show: true, type: "success", message: "Invoice created successfully!"});
        } catch (err) {
            setNotification({show: true, type: "error", message: err?.data?.message || "Failed to create invoice"});
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPrice = selectedItems.reduce((sum, item) => sum + (getItemPrice(item) * (item.selectedQuantity || 1)), 0);

    if (loadingComponents) return <div className="p-6">Loading...</div>;

    return (
        <div className="container mx-auto p-4 space-y-6">

            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() => setNotification({show: false})}
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() => setNotification({show: false})}
                errorMessage={notification.message}
                isActionLoading={isSubmitting}
            />

            <div className="bg-white border rounded-lg p-4 flex flex-col lg:flex-row gap-3 items-center">
                <input type="text" placeholder="Build name" value={buildName}
                       onChange={e => setBuildName(e.target.value)}
                       className="h-9 px-3 text-sm border rounded-md flex-1"/>
                <select className="h-9 px-3 text-sm border rounded-md w-56" value={currentBuildId || ""}
                        onChange={e => setCurrentBuildId(Number(e.target.value) || null)}>
                    <option value="">New Build</option>
                    {userBuilds.map(build => <option key={build.id} value={build.id}>{build.buildName}</option>)}
                </select>
                <button onClick={handleSaveBuild} disabled={isSubmitting}
                        className="h-9 px-4 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 transition">Save
                </button>
                {currentBuildId && <button onClick={handleDeleteBuild} disabled={isSubmitting}
                                           className="h-9 px-4 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition">Delete</button>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg border p-4 space-y-3">
                    {components.map(comp => {
                        const selectedItem = getSelectedItem(comp.id);
                        const disabled = isPowerSourceComp(comp) && !isPowerSourceEnabled;
                        return (
                            <div key={comp.id}
                                 className={`border rounded p-3 hover:bg-gray-50 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                 onClick={() => !disabled && setSelectedComponent(comp)}>
                                <div className="flex justify-between">
                                    <span>{comp.componentName}</span>
                                    {selectedItem && <div
                                        className="inline-flex items-center bg-green-50 border border-green-200 rounded-lg px-3 py-0.5 text-sm">
                                        <span className="font-semibold text-gray-800">{getItemName(selectedItem)}</span>
                                        <span className="mx-2 text-gray-400">|</span>
                                        <span
                                            className="font-bold text-green-700">Rs {getItemPrice(selectedItem)} × {selectedItem.selectedQuantity}</span>
                                        <button onClick={e => {
                                            e.stopPropagation();
                                            handleRemoveItem(comp.id);
                                        }} className="text-red-500">✕
                                        </button>
                                    </div>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white rounded-lg border p-4">
                    {selectedComponent ? (
                        <>
                            <h3 className="font-bold mb-3">{selectedComponent.componentName}</h3>
                            {filteredItems.map(item => {
                                const maxSlots = item.quantity ?? 0;
                                const selectedQty = isPowerSourceComp(item) ? 1 : (itemQuantities[item.id] || 1);
                                return (
                                    <div key={item.id} className="border p-3 rounded mb-2 hover:bg-blue-50">
                                        <div className="font-semibold text-gray-800">{getItemName(item)}</div>
                                        <div className="flex items-center justify-between">
                                            <div
                                                className="text-blue-600 font-bold text-lg">Rs {getItemPrice(item)}</div>
                                            <div className="flex items-center gap-3">
                                                {!isPowerSourceComp(item) && (
                                                    <input type="number" min="1" max={maxSlots} value={selectedQty}
                                                           disabled={maxSlots === 0}
                                                           onChange={e => {
                                                               let value = Number(e.target.value);
                                                               if (value < 1) value = 1;
                                                               if (value > maxSlots) value = maxSlots;
                                                               setItemQuantities(prev => ({...prev, [item.id]: value}));
                                                           }}
                                                           className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                                                )}
                                                <button
                                                    disabled={maxSlots === 0 || (isPowerSourceComp(item) && !isPowerSourceEnabled)}
                                                    onClick={() => handleAddItem(item, selectedQty)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 ${maxSlots === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}>
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        <div className="text-gray-500 text-center py-10">Select a component</div>
                    )}
                </div>
            </div>

            <div className="bg-white border rounded-lg p-4 flex justify-between items-center">
                <div className="text-xl font-bold text-green-600">Rs {totalPrice.toFixed(2)}</div>
                <div className="flex gap-3">
                    <button onClick={handleClearItems}
                            className="border px-6 py-2 rounded text-red-600 border-red-300">Clear Items
                    </button>
                    <button onClick={handleCreateInvoice} disabled={isSubmitting}
                            className="px-6 py-2 rounded text-white bg-blue-600 hover:bg-blue-700">
                        {isSubmitting ? "Processing..." : "Create Invoice"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BuildCart;