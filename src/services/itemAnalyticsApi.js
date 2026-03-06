import {baseApi} from "./baseApi.js";

export const itemAnalyticsApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        incrementViewCount: build.mutation({
            query: (id) => ({
                url: `/analytics/${id}`,
                method: "POST",
            }),
        }),

        getAnalyticsByAttribute: build.query({
            query: (attribute) => ({
                url: `/analytics`,
                method: "GET",
                params: {attribute},
            }),
            providesTags: (result, error, attribute) => [
                {type: "ItemAnalytics", id: attribute},
            ],
        }),

        getTrendingItems: build.query({
            query: () => ({
                url: `/analytics`,
                method: "GET",
            }),
            providesTags: [{type: "ItemAnalytics", id: "trending"}],
        }),
    }),
});

export const {
    useIncrementViewCountMutation,
    useGetAnalyticsByAttributeQuery,
    useGetTrendingItemsQuery,
} = itemAnalyticsApi;