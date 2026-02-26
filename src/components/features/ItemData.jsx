import React, { useState, useMemo } from "react";
import { useGetItemsQuery } from "../../features/components/itemApi.js";
import { useGetItemDataByItemIdAndVendorQuery } from "../../features/components/itemDataApi.js";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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

    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedVendor, setSelectedVendor] = useState(Vendors[0]);

    const { data: itemData, isLoading: loadingData, error: dataError } = useGetItemDataByItemIdAndVendorQuery(
        selectedItem ? { item_id: selectedItem, vendor: selectedVendor.toLowerCase() } : null,
        {
            skip: !selectedItem,
            refetchOnMountOrArgChange: true,
        }
    );

    const chartData = useMemo(() => {
        if (!itemData) return [];
        return itemData.map(d => ({
            date: new Date(d.recordedAt).toLocaleString(),
            ourPrice: d.ourPrice,
            vendorPrice: d.vendorPrice
        }));
    }, [itemData]);

    return (
        <div className="container mx-auto p-4 space-y-6">

            <div className="bg-white rounded-lg border p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 h-28">
                <div className="flex-1 flex flex-col justify-center gap-1 text-sm">
                    <label className="font-medium text-gray-700">Select Item:</label>
                    {loadingItems ? (
                        <span className="text-gray-500">Loading items...</span>
                    ) : itemsError ? (
                        <span className="text-red-500">{itemsError?.data?.message || "Error loading items."}</span>
                    ) : (
                        <select
                            value={selectedItem || ""}
                            onChange={e => setSelectedItem(e.target.value)}
                            className="border px-2 py-1 rounded text-sm w-full md:w-64"
                        >
                            <option value="" disabled>Select an item</option>
                            {items?.map(item => (
                                <option key={item.id} value={item.id}>{item.itemName}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex-1 flex flex-col justify-center gap-1 text-sm">
                    <label className="font-medium text-gray-700">Select Vendor:</label>
                    <select
                        value={selectedVendor}
                        onChange={e => setSelectedVendor(e.target.value)}
                        className="border px-2 py-1 rounded text-sm w-full md:w-64"
                    >
                        {Vendors.map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg border p-4 h-[28.8rem] flex flex-col">
                <div className="flex-1">
                    {loadingData ? (
                        <span className="text-gray-500 text-sm">Loading chart...</span>
                    ) : dataError ? (
                        <span className="text-red-500 text-sm">
                            {dataError?.data?.message || "Error loading chart."}
                        </span>
                    ) : chartData.length === 0 ? (
                        <span className="text-gray-500 text-sm">No data available.</span>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis domain={['dataMin', 'dataMax']} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Legend verticalAlign="top" height={36}/>
                                <Line type="monotone" dataKey="ourPrice" stroke="#10b981" strokeWidth={2} dot={false} name="Our Price" />
                                <Line type="monotone" dataKey="vendorPrice" stroke="#3b82f6" strokeWidth={2} dot={false} name="Vendor Price" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemData;