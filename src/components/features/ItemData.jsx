import React, { useState, useEffect } from "react";
import { useGetItemsQuery } from "../../services/itemApi.js";
import {
    useCreateItemDataMutation,
    useDeleteItemDataByItemIdAndVendorMutation
} from "../../services/itemDataApi.js";
import NotificationDialogs from "../common/NotificationDialogs.jsx";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

const Vendors = [
    "NANOTEK",
    "MD_COMPUTERS",
    "CHAMA_COMPUTERS",
    "GAME_STREET",
    "WINSOFT",
    "BARCLAYS",
    "PRIME_BUILD"
];

const ItemData = () => {
    const { data: items, isLoading: loadingItems, error: itemsError } = useGetItemsQuery();
    const [createItemData, { isLoading: loadingData }] = useCreateItemDataMutation();
    const [deleteItemData, { isLoading: deleting }] = useDeleteItemDataByItemIdAndVendorMutation();

    const [selectedItem, setSelectedItem] = useState("");
    const [selectedVendor, setSelectedVendor] = useState(Vendors[0]);
    const [chartData, setChartData] = useState([]);

    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
        errorAction: false,
        onErrorAction: null
    });

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-LK", { minimumFractionDigits: 2 }).format(amount);

    const latestDiscount =
        chartData.length > 0
            ? chartData[chartData.length - 1].discountPercentage
            : null;

    // 🔹 Clear chart when item or vendor changes
    useEffect(() => {
        setChartData([]);
    }, [selectedItem, selectedVendor]);

    // 🔥 FETCH (POST)
    const handleFetchData = async () => {
        if (!selectedItem || !selectedVendor) return;

        try {
            const response = await createItemData({
                itemId: selectedItem,
                vendor: selectedVendor
            }).unwrap();

            const mapped = response.map(d => ({
                date: new Date(d.recordedAt).toLocaleString(),
                ourPrice: d.ourPrice,
                vendorPrice: d.vendorPrice,
                discountPercentage: d.discountPercentage
            }));

            setChartData(mapped);

            setNotification({
                show: true,
                type: "success",
                message: "Data fetched successfully!"
            });

        } catch (err) {
            setNotification({
                show: true,
                type: "error",
                message: err?.data?.message || "Failed to fetch data"
            });
        }
    };

    // 🔥 DELETE
    const handleDelete = () => {
        if (!selectedItem || !selectedVendor) return;

        setNotification({
            show: true,
            type: "error",
            message: "Are you sure you want to delete this data?",
            errorAction: true,
            onErrorAction: async () => {
                try {
                    await deleteItemData({
                        item_id: selectedItem,
                        vendor: selectedVendor
                    }).unwrap();

                    setChartData([]);

                    setNotification({
                        show: true,
                        type: "success",
                        message: "Data deleted successfully!"
                    });

                } catch (err) {
                    setNotification({
                        show: true,
                        type: "error",
                        message: err?.data?.message || "Delete failed"
                    });
                }
            }
        });
    };

    return (
        <div className="container mx-auto p-4 space-y-6">

            <NotificationDialogs
                showSuccessDialog={notification.show && notification.type === "success"}
                setShowSuccessDialog={() =>
                    setNotification({ show: false, type: "", message: "" })
                }
                successMessage={notification.message}
                showErrorDialog={notification.show && notification.type === "error"}
                setShowErrorDialog={() =>
                    setNotification({ show: false, type: "", message: "" })
                }
                errorMessage={notification.message}
                errorAction={notification.errorAction}
                onErrorAction={notification.onErrorAction}
                isActionLoading={deleting}
            />

            {/* Selection Panel */}
            <div className="bg-white border rounded-lg p-4 flex gap-6 items-end">
                <div>
                    <label className="text-sm font-medium">Select Item</label>
                    {loadingItems ? (
                        <div className="text-gray-500 text-sm">Loading...</div>
                    ) : itemsError ? (
                        <div className="text-red-500 text-sm">Error loading items</div>
                    ) : (
                        <select
                            value={selectedItem}
                            onChange={e => setSelectedItem(e.target.value)}
                            className="border rounded px-2 py-1 w-64"
                        >
                            <option value="">Select an item</option>
                            {items?.map(item => (
                                <option key={item.id} value={item.id}>{item.itemName}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium">Select Vendor</label>
                    <select
                        value={selectedVendor}
                        onChange={e => setSelectedVendor(e.target.value)}
                        className="border rounded px-2 py-1 w-64"
                    >
                        {Vendors.map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </select>
                </div>

                {latestDiscount !== null && (
                    <div className="text-center">
                        <div className="text-xs text-gray-500">Current Discount</div>
                        <div className={`text-xl font-bold ${latestDiscount < 0 ? "text-red-500" : "text-green-600"}`}>
                            {latestDiscount}%
                        </div>
                    </div>
                )}
            </div>

            {/* Chart Section */}
            <div className="bg-white border rounded-lg p-4 h-[28rem] flex flex-col">
                <div className="flex-1">
                    {loadingData ? (
                        <div className="text-gray-500 text-sm">Loading data...</div>
                    ) : chartData.length === 0 ? (
                        <div className="text-gray-400 text-sm">No data available.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="date" tick={{fontSize: 10}} />
                                <YAxis
                                    domain={[
                                        (dataMin) => dataMin - 200,
                                        (dataMax) => dataMax + 200
                                    ]}
                                    tick={{ fontSize: 10 }}
                                    tickFormatter={formatCurrency}
                                />
                                <Tooltip
                                    contentStyle={{fontSize: "10px"}}
                                    itemStyle={{fontSize: "10px"}}
                                    labelStyle={{fontSize: "10px"}}
                                />
                                <Legend wrapperStyle={{fontSize: "10px"}} />
                                <Line type="monotone" dataKey="ourPrice" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="vendorPrice" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 justify-end mt-4">
                    <button
                        onClick={handleFetchData}
                        disabled={!selectedItem || loadingData}
                        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {loadingData ? "Fetching..." : "Fetch Data"}
                    </button>

                    <button
                        onClick={handleDelete}
                        disabled={!selectedItem || deleting}
                        className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {deleting ? "Deleting..." : "Delete Data"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemData;