import React, { useState } from "react";
import {
    useGetAnalyticsByAttributeQuery,
    useGetTrendingItemsQuery
} from "../../services/itemAnalyticsApi.js";

const AnalyticsAttributes = ["views", "sales", "carts", "trend"];

const ItemAnalytics = () => {
    const [selectedAttribute, setSelectedAttribute] = useState("trend");

    const { data: analyticsData, isLoading, error, refetch } =
        selectedAttribute === "trend"
            ? useGetTrendingItemsQuery(undefined, {
                refetchOnMountOrArgChange: true,
            })
            : useGetAnalyticsByAttributeQuery(selectedAttribute, {
                refetchOnMountOrArgChange: true,
            });

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="bg-white rounded-lg border p-4 flex items-center gap-4">
                <label className="font-medium text-gray-700">Select Analytics:</label>
                <select
                    value={selectedAttribute}
                    onChange={(e) => setSelectedAttribute(e.target.value)}
                    className="border px-2 py-1 rounded text-sm"
                >
                    {AnalyticsAttributes.map(attr => (
                        <option key={attr} value={attr}>{attr.toUpperCase()}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded-lg border p-4 overflow-x-auto">
                {isLoading ? (
                    <span className="text-gray-500">Loading analytics...</span>
                ) : error ? (
                    <span className="text-red-500">{error?.data?.message || "Error fetching analytics."}</span>
                ) : !analyticsData || analyticsData.length === 0 ? (
                    <span className="text-gray-500">No analytics data available.</span>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Item</th>
                            <th className="px-4 py-2 text-left">Views</th>
                            <th className="px-4 py-2 text-left">Sales</th>
                            <th className="px-4 py-2 text-left">Cart Adds</th>
                            <th className="px-4 py-2 text-left">Revenue (LKR)</th>
                            <th className="px-4 py-2 text-left">Trend Score</th>
                        </tr>
                        </thead>
                        <tbody>
                        {analyticsData.map((a) => (
                            <tr key={a.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2">{a.item.itemName}</td>
                                <td className="px-4 py-2">{a.totalViews}</td>
                                <td className="px-4 py-2">{a.totalSales}</td>
                                <td className="px-4 py-2">{a.totalCartAdds}</td>
                                <td className="px-4 py-2">
                                    {a.totalRevenue.toLocaleString("en-LK", { style: "currency", currency: "LKR" })}
                                </td>
                                <td className="px-4 py-2">{a.trendScore}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ItemAnalytics;