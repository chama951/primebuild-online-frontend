import {baseApi} from "../../services/baseApi.js";

export const itemComponentCountApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getItemComponentCountByItemAndComponent: builder.query({
            query: ({item, component}) => ({
                url: "/item_component_count",
                params: {item, component},
            }),
            providesTags: (result, error, {item, component}) => [
                {type: "ItemComponentCount", id: `${item}-${component}`},
            ],
        }),

        getItemComponentCountById: builder.query({
            query: (id) => `/item_component_count/${id}`,
            providesTags: (result, error, id) => [{type: "ItemComponentCount", id}],
        }),

        createItemComponentCount: builder.mutation({
            query: ({itemId, componentId, componentCount}) => ({
                url: "/item_component_count",
                method: "POST",
                body: {itemId, componentId, componentCount},
            }),
            invalidatesTags: ["ItemComponentCount"],
        }),

        updateItemComponentCount: builder.mutation({
            query: ({id, itemId, componentId, componentCount}) => ({
                url: `/item_component_count/${id}`,
                method: "PUT",
                body: {itemId, componentId, componentCount},
            }),
            invalidatesTags: (result, error, {id}) => [{type: "ItemComponentCount", id}],
        }),

        updateItemComponentOnlyCount: builder.mutation({
            query: ({id, componentCount}) => ({
                url: `/item_component_count/${id}`,
                method: "PATCH",
                body: {componentCount},
            }),
            invalidatesTags: (result, error, {id}) => [{type: "ItemComponentCount", id}],
        }),

        getItemComponentCountsByItemId: builder.query({
            query: (item) => ({
                url: "/item_component_count",
                params: item
            }),
            providesTags: (result, error, item) => [
                {type: "ItemComponentCount", id: `${item}`},
            ],
        }),

        deleteItemComponentCount: builder.mutation({
            query: (id) => ({
                url: `/item_component_count/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [{type: "ItemComponentCount", id}],
        }),
    })
})

export const {
    useGetItemComponentCountByItemAndComponentQuery,
    useGetItemComponentCountByIdQuery,
    useCreateItemComponentCountMutation,
    useUpdateItemComponentCountMutation,
    useUpdateItemComponentOnlyCountMutation,
    useGetItemComponentCountsByItemIdQuery,
    useDeleteItemComponentCountMutation,
} = itemComponentCountApi;

