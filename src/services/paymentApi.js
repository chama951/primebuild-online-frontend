import { baseApi } from "./baseApi.js";

export const paymentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getPayments: builder.query({
            query: () => "/payment",
            providesTags: ["Payment"],
        }),

        getPaymentById: builder.query({
            query: (id) => `/payment/${id}`,
            providesTags: (result, error, id) => [{ type: "Payment", id }],
        }),

        getPaymentsByLoggedIn: builder.query({
            query: () => `/payment?logged_in=true`,
            providesTags: ["Payment"],
        }),

        getPaymentsByUserId: builder.query({
            query: (userId) => `/payment?user_id=${userId}`,
            providesTags: ["Payment"],
        }),

        getPaymentsByDate: builder.query({
            query: (date) => `/payment?date=${date}`,
            providesTags: ["Payment"],
        }),

        getPaymentsByStatus: builder.query({
            query: (status) => `/payment?payment_status=${status}`,
            providesTags: ["Payment"],
        }),

        createPayment: builder.mutation({
            query: (paymentData) => ({
                url: "/payment",
                method: "POST",
                body: paymentData,
            }),
            invalidatesTags: ["Payment"],
        }),

        updatePayment: builder.mutation({
            query: ({ id, ...paymentData }) => ({
                url: `/payment/${id}`,
                method: "PUT",
                body: paymentData,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Payment", id }],
        }),

        deletePayment: builder.mutation({
            query: (id) => ({
                url: `/payment/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Payment"],
        }),
        getPaymentsByUsername: builder.query({
            query: (username) => `/payment?username=${username}`,
            providesTags: ["Payment"],
        }),
    }),
});

export const {
    useGetPaymentsQuery,
    useGetPaymentByIdQuery,
    useGetPaymentsByLoggedInQuery,
    useGetPaymentsByUserIdQuery,
    useGetPaymentsByDateQuery,
    useGetPaymentsByStatusQuery,
    useCreatePaymentMutation,
    useUpdatePaymentMutation,
    useDeletePaymentMutation,
    useGetPaymentsByUsernameQuery,
} = paymentApi;
