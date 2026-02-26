import React, { useState } from "react";
import {
    useGetExchangeRateQuery,
    useGetExchangeRateByDaysQuery,
    useConvertUsdToLkrMutation
} from "../../services/exchangeRateApi.js";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const ExchangeRate = () => {
    const { data: rateData, isLoading: loadingRate, error: rateError } = useGetExchangeRateQuery();

    const [days, setDays] = useState(5);

    const { data: lastDaysRates, isLoading: loadingDays, error: daysError } = useGetExchangeRateByDaysQuery(days);

    const [convertUsdToLkr, { data: conversionResult, isLoading: converting, error: conversionError }] = useConvertUsdToLkrMutation();

    const [usdAmount, setUsdAmount] = useState("");

    const handleConvert = async () => {
        if (!usdAmount) return;
        try {
            await convertUsdToLkr({ usdAmount: parseFloat(usdAmount), lkrAmount: null }).unwrap();
        } catch (err) {
            console.error("Conversion failed:", err);
        }
    };

    const chartData = lastDaysRates?.map(rate => ({
        date: rate.date,
        rate: rate.rate,
    })) || [];

    return (
        <div className="container mx-auto p-4 space-y-6">

            <div className="bg-white rounded-lg border p-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 h-28">

                <div className="flex-1 flex flex-col justify-center gap-1 text-sm">
                    {loadingRate ? (
                        <span className="text-gray-500">Loading latest rate...</span>
                    ) : rateError ? (
                        <span className="text-red-500">Error loading rate.</span>
                    ) : (
                        <>
                            <div className="font-medium">{rateData?.rate?.toFixed(3)} LKR / USD</div>
                            <div className="text-gray-500 text-xs">Last Updated: {new Date(rateData?.lastUpdated).toLocaleString()}</div>
                        </>
                    )}
                </div>

                <div className="flex-1 flex flex-col gap-1 text-sm">
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={usdAmount}
                            onChange={(e) => setUsdAmount(e.target.value)}
                            className="flex-1 border px-2 py-1 rounded text-sm"
                            placeholder="USD"
                        />
                        <button
                            onClick={handleConvert}
                            disabled={!usdAmount || converting}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                            {converting ? "Converting..." : "Convert"}
                        </button>
                    </div>

                    {conversionResult && (
                        <div className="text-green-800 bg-green-100 px-2 py-1 rounded text-sm mt-1">
                            {conversionResult.usdAmount} USD = {conversionResult.lkrAmount?.toLocaleString("en-LK", { style: "currency", currency: "LKR" })}
                        </div>
                    )}
                    {conversionError && (
                        <div className="text-red-500 text-sm mt-1">Conversion failed. Try again.</div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg border p-4 h-[28.8rem] flex flex-col">
                <div className="flex items-center gap-2 text-sm mb-2">
                    <label className="font-medium text-gray-700">Days:</label>
                    <input
                        type="number"
                        min={1}
                        max={30}
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                        className="border px-2 py-1 rounded w-16 text-sm"
                    />
                </div>

                <div className="flex-1">
                    {loadingDays ? (
                        <span className="text-gray-500 text-sm">Loading chart...</span>
                    ) : daysError ? (
                        <span className="text-red-500 text-sm">Error loading chart.</span>
                    ) : chartData.length === 0 ? (
                        <span className="text-gray-500 text-sm">No data available.</span>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis domain={['dataMin', 'dataMax']} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExchangeRate;