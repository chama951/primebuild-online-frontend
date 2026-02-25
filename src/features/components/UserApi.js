import {baseApi} from "../../services/baseApi.js";

export const userApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get current authenticated user
        getCurrentUser: builder.query({
            query: () => "/auth/self",
            providesTags: ["CurrentUser"],
        }),
        // Get all users with optional filters
        getUsers: builder.query({
            query: ({username, email, type} = {}) => {
                let url = "/user";
                const params = new URLSearchParams();

                if (username) params.append("username", username);
                if (email) params.append("email", email);
                if (type) params.append("type", type);

                const queryString = params.toString();
                if (queryString) url += `?${queryString}`;

                return url;
            },
            providesTags: (result) =>
                result ? [
                    ...result.map(({userId}) => ({type: "User", id: userId})),
                    {type: "User", id: "LIST"}
                ] : [{type: "User", id: "LIST"}],
        }),

        // Get user by ID
        getUserById: builder.query({
            query: (id) => `/user/${id}`,
            providesTags: (result, error, id) => [{type: "User", id}],
        }),

        // Get user by username
        getUserByUsername: builder.query({
            query: (username) => `/user?username=${username}`,
            providesTags: (result, error, username) => [{type: "User", id: username}],
        }),

        // Get user by email
        getUserByEmail: builder.query({
            query: (email) => `/user?email=${email}`,
            providesTags: (result, error, email) => [{type: "User", id: email}],
        }),

        // Get users by type (staff or customer)
        getUsersByType: builder.query({
            query: (type) => `/user?type=${type}`,
            providesTags: (result, error, type) => [{type: "User", id: type}],
        }),

        // Update user
        updateUser: builder.mutation({
            query: ({id, ...userData}) => ({
                url: `/user/${id}`,
                method: "PUT",
                body: userData,
            }),
            invalidatesTags: (result, error, {id}) => [
                {type: "User", id},
                {type: "User", id: "LIST"},
            ],
        }),

        // Delete user
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `/user/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                {type: "User", id},
                {type: "User", id: "LIST"},
            ],
        }),
        // Forgot Password (Send PIN)
        forgotPassword: builder.mutation({
            query: (email) => ({
                url: `/auth/forgot-password`,
                method: "POST",
                body: {email},
            }),
        }),

        // Reset Password
        resetPassword: builder.mutation({
            query: (data) => ({
                url: `/auth/reset-password`,
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const {
    useGetCurrentUserQuery,
    useGetUsersQuery,
    useGetUserByIdQuery,
    useGetUserByUsernameQuery,
    useGetUserByEmailQuery,
    useGetUsersByTypeQuery,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
} = userApi;