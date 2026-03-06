import {baseApi} from "./baseApi.js";

export const invoiceApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getInvoices: builder.query({
            query: () => "/invoice",
            providesTags: ["Invoice"],
        }),

        getInvoiceById: builder.query({
            query: (id) => `/invoice/${id}`,
            providesTags: (result, error, id) => [{type: "Invoice", id}],
        }),

        getInvoicesByLoggedIn: builder.query({
            query: () => `/invoice?logged_in=true`,
            providesTags: ["Invoice"],
        }),

        getInvoicesByUserId: builder.query({
            query: (userId) => `/invoice?user_id=${userId}`,
            providesTags: ["Invoice"],
        }),

        getInvoicesByDate: builder.query({
            query: (date) => `/invoice?date=${date}`,
            providesTags: ["Invoice"],
        }),

        getInvoicesByStatus: builder.query({
            query: (status) => `/invoice?invoice_status=${status}`,
            providesTags: ["Invoice"],
        }),

        createInvoice: builder.mutation({
            query: (invoiceData) => ({
                url: "/invoice",
                method: "POST",
                body: invoiceData,
            }),
            invalidatesTags: ["Invoice"],
        }),

        updateInvoice: builder.mutation({
            query: ({id, ...invoiceData}) => ({
                url: `/invoice/${id}`,
                method: "PUT",
                body: invoiceData,
            }),
            invalidatesTags: (result, error, {id}) => [{type: "Invoice", id}],
        }),

        deleteInvoice: builder.mutation({
            query: (id) => ({
                url: `/invoice/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Invoice"],
        }),

        getInvoicesByUserType: builder.query({
            query: (userType) => `/invoice?user_type=${userType}`,
            providesTags: ["Invoice"],
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
    useGetInvoicesByUserTypeQuery,
} = invoiceApi;
