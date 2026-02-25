import { baseApi } from "../../services/baseApi.js";

export const paymentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        // Get all payments
        getPayments: builder.query({
            query: () => "/payment",
            providesTags: ["Payment"],
        }),

        // Get payment by ID
        getPaymentById: builder.query({
            query: (id) => `/payment/${id}`,
            providesTags: (result, error, id) => [{ type: "Payment", id }],
        }),

        // Get payments by logged-in user (if needed)
        getPaymentsByLoggedIn: builder.query({
            query: () => `/payment?logged_in=true`,
            providesTags: ["Payment"],
        }),

        // Get payments by user ID
        getPaymentsByUserId: builder.query({
            query: (userId) => `/payment?user_id=${userId}`,
            providesTags: ["Payment"],
        }),

        // Get payments by date
        getPaymentsByDate: builder.query({
            query: (date) => `/payment?date=${date}`,
            providesTags: ["Payment"],
        }),

        // Get payments by status
        getPaymentsByStatus: builder.query({
            query: (status) => `/payment?payment_status=${status}`,
            providesTags: ["Payment"],
        }),

        // Create payment
        createPayment: builder.mutation({
            query: (paymentData) => ({
                url: "/payment",
                method: "POST",
                body: paymentData,
            }),
            invalidatesTags: ["Payment"],
        }),

        // Update payment
        updatePayment: builder.mutation({
            query: ({ id, ...paymentData }) => ({
                url: `/payment/${id}`,
                method: "PUT",
                body: paymentData,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Payment", id }],
        }),

        // Delete payment
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
