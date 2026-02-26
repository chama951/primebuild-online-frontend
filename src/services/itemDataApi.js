import {baseApi} from "./baseApi.js";

export const itemDataApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getItemDataByItemIdAndVendor: builder.query({
            query: ({item_id, vendor}) => `/item_data?item_id=${item_id}&vendor=${vendor}`,
            providesTags: ["ItemData"],
        }),
        getItemDataByItemId: builder.query({
            query: (item_id) => `/item_data/${item_id}`,
            transformResponse: (response) => response || [],
            providesTags: ["ItemData"],
        }),
    }),
});

export const {
    useGetItemDataByItemIdAndVendorQuery,
    useGetItemDataByItemIdQuery
} = itemDataApi;