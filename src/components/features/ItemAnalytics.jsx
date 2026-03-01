import React, {useState, useMemo} from "react";
import {
    useGetAnalyticsByAttributeQuery,
    useGetTrendingItemsQuery
} from "../../services/itemAnalyticsApi.js";

const AnalyticsAttributes = ["views", "sales", "carts", "trend"];

const ItemAnalytics = () => {
    const [selectedAttribute, setSelectedAttribute] = useState("trend");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const {data: analyticsData, isLoading, error} =
        selectedAttribute === "trend"
            ? useGetTrendingItemsQuery(undefined, {refetchOnMountOrArgChange: true})
            : useGetAnalyticsByAttributeQuery(selectedAttribute, {refetchOnMountOrArgChange: true});

    const paginatedData = useMemo(() => {
        if (!analyticsData) return [];
        const start = (currentPage - 1) * itemsPerPage;
        return analyticsData.slice(start, start + itemsPerPage);
    }, [analyticsData, currentPage]);

    const totalPages = analyticsData ? Math.ceil(analyticsData.length / itemsPerPage) : 1;

    React.useEffect(() => {
        setCurrentPage(1);
    }, [selectedAttribute]);

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
                    <>
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide">Item</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide">Views</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide">Sales</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide">Cart
                                    Adds
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide">Revenue

                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 uppercase tracking-wide">Trend
                                    Score
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedData.map((a) => (
                                <tr key={a.id} className="hover:bg-blue-50 transition-colors cursor-pointer">
                                    <td className="px-4 py-2">{a.item.itemName}</td>
                                    <td className="px-4 py-2">{a.totalViews}</td>
                                    <td className="px-4 py-2">{a.totalSales}</td>
                                    <td className="px-4 py-2">{a.totalCartAdds}</td>
                                    <td className="px-4 py-2 font-semibold text-blue-600">
                                        {a.totalRevenue.toLocaleString("en-LK", {style: "currency", currency: "LKR"})}
                                    </td>
                                    <td className="px-4 py-2 font-medium">{a.trendScore}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-4">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border rounded disabled:opacity-50"
                                >
                                    Prev
                                </button>

                                {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 border rounded ${currentPage === page ? "bg-blue-600 text-white" : ""}`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
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