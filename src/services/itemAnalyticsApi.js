import { baseApi } from "./baseApi.js";

export const itemAnalyticsApi = baseApi.injectEndpoints({
    endpoints: (build) => ({

        incrementViewCount: build.mutation({
            query: (id) => ({
                url: `/analytics/${id}`,
                method: "POST",
            }),
        }),

        getAnalyticsByAttribute: build.query({
            query: ({ attribute, page = 1, size = 2 }) => ({
                url: `/analytics?attribute=${attribute}&page=${page}&size=${size}`,
                method: "GET",
            }),
            providesTags: (result, error, { attribute }) => [
                { type: "ItemAnalytics", id: attribute },
            ],
        }),

        getTrendingItems: build.query({
            query: () => ({
                url: `/analytics`,
                method: "GET",
            }),
            providesTags: [{ type: "ItemAnalytics", id: "trending" }],
        }),
    }),
});

export const {
    useIncrementViewCountMutation,
    useGetAnalyticsByAttributeQuery,
    useGetTrendingItemsQuery,
} = itemAnalyticsApi;