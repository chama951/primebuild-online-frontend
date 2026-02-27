import { baseApi } from "./baseApi.js";

export const itemDataApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createItemData: builder.mutation({
            query: (body) => ({
                url: "/item_data",
                method: "POST",
                body,
            }),
            invalidatesTags: ["ItemData"],
        }),

        getItemDataByItemIdAndVendor: builder.query({
            query: ({ item_id, vendor }) =>
                `/item_data/${item_id}?vendor=${vendor}`,
        }),

        getItemDataByItemId: builder.query({
            query: (item_id) => `/item_data/${item_id}`,
            transformResponse: (response) => response || [],
            providesTags: ["ItemData"],
        }),

        deleteItemDataByItemIdAndVendor: builder.mutation({
            query: ({ item_id, vendor }) => ({
                url: `/item_data/${item_id}?vendor=${vendor}`,
                method: "DELETE",
            }),
            invalidatesTags: ["ItemData"],
        }),
    }),
});

export const {
    useCreateItemDataMutation,
    useGetItemDataByItemIdAndVendorQuery,
    useGetItemDataByItemIdQuery,
    useDeleteItemDataByItemIdAndVendorMutation,
} = itemDataApi;