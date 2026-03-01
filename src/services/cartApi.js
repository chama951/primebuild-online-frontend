import {baseApi} from "./baseApi.js";

export const cartApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getCart: builder.query({
            query: () => "/cart",
            providesTags: ["Cart"],
        }),

        createOrUpdateCart: builder.mutation({
            query: (cartData) => ({
                url: "/cart",
                method: "POST",
                body: cartData,
            }),
            invalidatesTags: ["Cart"],
        }),

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