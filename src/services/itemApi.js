import {baseApi} from "./baseApi.js";

export const itemApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getItems: builder.query({
            query: () => "/item",
            providesTags: ["Item"],
        }),

        getPaginatedItems: builder.query({
            query: ({ componentId = "", page = 0, size = 8, search = "" }) => {
                let url = `/item/paginated?page=${page}&size=${size}`;
                if (componentId) url += `&component=${componentId}`;
                if (search) url += `&search=${search}`;
                return url;
            },
            providesTags: (result, error, { componentId }) => [{ type: "ItemByComponent", id: componentId || "all" }],
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

        getPaginatedItemsByComponentId: builder.query({
            query: ({ componentId = "", page = 0, size = 8, search = null }) => {
                const params = new URLSearchParams();
                params.append("component", componentId);  // always include component
                params.append("page", page);
                params.append("size", size);
                if (search) params.append("search", search); // only append if search term exists

                return `/item/paginated?${params.toString()}`;
            },
            providesTags: (result, error, { componentId }) => [
                { type: "ItemByComponent", id: componentId },
            ],
        }),
    }),
});

export const {
    useGetPaginatedItemsQuery,
    useGetPaginatedItemsByComponentIdQuery,
    useGetItemsQuery,
    useCreateItemMutation,
    useUpdateItemMutation,
    useDeleteItemMutation,
    useGetItemByIdQuery,
} = itemApi;