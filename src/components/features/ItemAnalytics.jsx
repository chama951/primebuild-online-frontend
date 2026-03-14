import React, { useState, useEffect } from "react";
import {
    useGetAnalyticsByAttributeQuery,
    useGetTrendingItemsQuery
} from "../../services/itemAnalyticsApi.js";
import Unauthorized from "../common/Unauthorized.jsx";

const AnalyticsAttributes = ["views", "sales", "carts", "trend"];

const ItemAnalytics = () => {
    const [selectedAttribute, setSelectedAttribute] = useState("trend");
    const [currentPage, setCurrentPage] = useState(0); // 0-based for backend
    const pageSize = 12;
    const maxPagesToShow = 5; // Show max 5 page buttons

    const { data: pageData, isLoading, error } =
        selectedAttribute === "trend"
            ? useGetTrendingItemsQuery({ page: currentPage, size: pageSize }, { refetchOnMountOrArgChange: true })
            : useGetAnalyticsByAttributeQuery(
                { attribute: selectedAttribute, page: currentPage, size: pageSize },
                { refetchOnMountOrArgChange: true }
            );

    useEffect(() => {
        setCurrentPage(0);
    }, [selectedAttribute]);

    if (error?.status === 401 || error?.status === 403) return <Unauthorized />;

    const items = pageData?.content || [];
    const totalPages = pageData?.totalPages || 1;

    const getPageNumbers = () => {
        let start = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 0);
        let end = start + maxPagesToShow - 1;

        if (end >= totalPages) {
            end = totalPages - 1;
            start = Math.max(end - maxPagesToShow + 1, 0);
        }

        const pages = [];
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* Attribute Selector */}
            <div className="bg-white rounded-lg border p-4 flex items-center gap-4">
                <label className="font-medium text-gray-700">Select Analytics:</label>
                <select
                    value={selectedAttribute}
                    onChange={(e) => setSelectedAttribute(e.target.value)}
                    className="border px-2 py-1 rounded text-sm"
                >
                    {AnalyticsAttributes.map((attr) => (
                        <option key={attr} value={attr}>
                            {attr.toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border p-4 overflow-x-auto">
                {isLoading ? (
                    <span className="text-gray-500">Loading analytics...</span>
                ) : items.length === 0 ? (
                    <span className="text-gray-500">No analytics data available.</span>
                ) : (
                    <>
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide">Item</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide">Views</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide">Sales</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide">Cart Adds</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide">Revenue</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide">Trend Score</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {items.map((a) => (
                                <tr key={a.id} className="hover:bg-blue-50 transition-colors cursor-pointer">
                                    <td className="px-4 py-2">{a.item.itemName}</td>
                                    <td className="px-4 py-2">{a.totalViews}</td>
                                    <td className="px-4 py-2">{a.totalSales}</td>
                                    <td className="px-4 py-2">{a.totalCartAdds}</td>
                                    <td className="px-4 py-2 font-semibold text-blue-600">
                                        {a.totalRevenue.toLocaleString("en-LK", { style: "currency", currency: "LKR" })}
                                    </td>
                                    <td className="px-4 py-2 font-medium">{a.trendScore}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-4">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                                    disabled={currentPage === 0}
                                    className="px-3 py-1 border rounded disabled:opacity-50"
                                >
                                    Prev
                                </button>

                                {pageNumbers.map((i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`px-3 py-1 border rounded ${currentPage === i ? "bg-blue-600 text-white" : ""}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                                    disabled={currentPage === totalPages - 1}
                                    className="px-3 py-1 border rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ItemAnalytics;