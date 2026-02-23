import { baseApi } from "../../services/baseApi.js";

export const cartApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        // Get current user's cart
        getCart: builder.query({
            query: () => "/cart",
            providesTags: ["Cart"],
        }),

        // Create / Update cart (Add items)
        createOrUpdateCart: builder.mutation({
            query: (cartData) => ({
                url: "/cart",
                method: "POST",
                body: cartData,
            }),
            invalidatesTags: ["Cart"],
        }),

        // Clear / Delete cart
        deleteCart: builder.mutation({
            query: () => ({
                url: "/cart",
                method: "DELETE",
            }),
            invalidatesTags: ["Cart"],
        }),

    }),
});

export const {
    useGetCartQuery,
    useCreateOrUpdateCartMutation,
    useDeleteCartMutation,
} = cartApi;