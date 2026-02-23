import {baseApi} from "../../services/baseApi.js";

export const itemApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getItems: builder.query({
            query: () => "/item",
            providesTags: ["Item"],
        }),

        getItemById: builder.query({
            query: (id) => `/item/${id}`,
            providesTags: (result, error, id) => [{type: "Item", id}],
        }),

        createItem: builder.mutation({
            query: (itemData) => ({
                url: "/item",
                method: "POST",
                body: itemData,
            }),
            invalidatesTags: ["Item"],
        }),

        updateItem: builder.mutation({
            query: ({id, ...itemData}) => ({
                url: `/item/${id}`,
                method: "PUT",
                body: itemData,
            }),
            invalidatesTags: (result, error, {id}) => [{type: "Item", id}],
        }),

        deleteItem: builder.mutation({
            query: (id) => ({
                url: `/item/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Item"],
        }),

        getItemsByComponentId: builder.query({
            query: (componentId) => `/item?component=${componentId}`,
            providesTags: (result, error, componentId) => [
                {type: "ItemByComponent", id: componentId},
            ],
        }),
    }),
});

export const {
    useGetItemsQuery,
    useGetItemsByComponentIdQuery,
    useCreateItemMutation,
    useUpdateItemMutation,
    useDeleteItemMutation,
    useGetItemByIdMutation,
} = itemApi;