import {baseApi} from "./baseApi.js";

export const userApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getCurrentUser: builder.query({
            query: () => "/auth/self",
            providesTags: ["CurrentUser"],
        }),
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

        getUserById: builder.query({
            query: (id) => `/user/${id}`,
            providesTags: (result, error, id) => [{type: "User", id}],
        }),

        getUserByUsername: builder.query({
            query: (username) => `/user?username=${username}`,
            providesTags: (result, error, username) => [{type: "User", id: username}],
        }),

        getUserByEmail: builder.query({
            query: (email) => `/user?email=${email}`,
            providesTags: (result, error, email) => [{type: "User", id: email}],
        }),

        getUsersByType: builder.query({
            query: (type) => `/user?type=${type}`,
            providesTags: (result, error, type) => [{type: "User", id: type}],
        }),

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
        forgotPassword: builder.mutation({
            query: (email) => ({
                url: `/auth/forgot-password`,
                method: "POST",
                body: {email},
            }),
        }),

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