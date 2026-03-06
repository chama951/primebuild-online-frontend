import {baseApi} from "./baseApi.js";

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: "/auth/login",
                method: "POST",
                body: credentials,
            }),
        }),

        signupCustomer: builder.mutation({
            query: (body) => ({
                url: "/auth/signup?type=customer",
                method: "POST",
                body,
            }),
        }),

        signupStaff: builder.mutation({
            query: (body) => ({
                url: "/auth/signup?type=staff",
                method: "POST",
                body,
            }),
        }),
        isCustomerLoggedIn: builder.query({
            query: () => ({
                url: "/auth/is_customer_logged_in",
                method: "GET",
            }),
        }),


    }),
});

export const {
    useLoginMutation,
    useSignupCustomerMutation,
    useIsCustomerLoggedInQuery,
    useSignupStaffMutation
} = authApi;
