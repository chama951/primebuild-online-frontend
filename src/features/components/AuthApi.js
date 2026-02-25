import {baseApi} from "../../services/baseApi.js";

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
    }),
});

export const {
    useLoginMutation,
    useSignupCustomerMutation,
    useSignupStaffMutation
} = authApi;
