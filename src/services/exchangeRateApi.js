import {baseApi} from "./baseApi.js";

export const exchangeRateApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getExchangeRate: builder.query({
            query: () => "/exchange_rate",
            providesTags: ["ExchangeRate"],
        }),

        getExchangeRateByDays: builder.query({
            query: (days) => `/exchange_rate/${days}`,
            providesTags: ["ExchangeRate"],
        }),

        convertUsdToLkr: builder.mutation({
            query: (amountData) => ({
                url: "/exchange_rate",
                method: "POST",
                body: amountData,
            }),
        }),
    }),
});

export const {
    useGetExchangeRateQuery,
    useGetExchangeRateByDaysQuery,
    useConvertUsdToLkrMutation,
} = exchangeRateApi;