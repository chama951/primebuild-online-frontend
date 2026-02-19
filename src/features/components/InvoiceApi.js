import { baseApi } from "../../services/baseApi.js";

export const invoiceApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        // Get all invoices
        getInvoices: builder.query({
            query: () => "/invoice",
            providesTags: ["Invoice"],
        }),

        // Get invoice by ID
        getInvoiceById: builder.query({
            query: (id) => `/invoice/${id}`,
            providesTags: (result, error, id) => [{ type: "Invoice", id }],
        }),

        // Get invoices for logged-in user
        getInvoicesByLoggedIn: builder.query({
            query: () => `/invoice?logged_in=true`,
            providesTags: ["Invoice"],
        }),

        // Get invoices by user ID
        getInvoicesByUserId: builder.query({
            query: (userId) => `/invoice?user_id=${userId}`,
            providesTags: ["Invoice"],
        }),

        // Get invoices by date
        getInvoicesByDate: builder.query({
            query: (date) => `/invoice?date=${date}`,
            providesTags: ["Invoice"],
        }),

        // Get invoices by status
        getInvoicesByStatus: builder.query({
            query: (status) => `/invoice?invoice_status=${status}`,
            providesTags: ["Invoice"],
        }),

        // Create invoice
        createInvoice: builder.mutation({
            query: (invoiceData) => ({
                url: "/invoice",
                method: "POST",
                body: invoiceData,
            }),
            invalidatesTags: ["Invoice"],
        }),

        // Update invoice
        updateInvoice: builder.mutation({
            query: ({ id, ...invoiceData }) => ({
                url: `/invoice/${id}`,
                method: "PUT",
                body: invoiceData,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Invoice", id }],
        }),

        // Delete invoice
        deleteInvoice: builder.mutation({
            query: (id) => ({
                url: `/invoice/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Invoice"],
        }),
    }),
});

export const {
    useGetInvoicesQuery,
    useGetInvoiceByIdQuery,
    useGetInvoicesByLoggedInQuery,
    useGetInvoicesByUserIdQuery,
    useGetInvoicesByDateQuery,
    useGetInvoicesByStatusQuery,
    useCreateInvoiceMutation,
    useUpdateInvoiceMutation,
    useDeleteInvoiceMutation,
} = invoiceApi;
