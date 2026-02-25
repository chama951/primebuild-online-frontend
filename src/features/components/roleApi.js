import { baseApi } from "../../services/baseApi.js";

export const roleApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Get all roles
        getRoles: builder.query({
            query: () => "/role",
            providesTags: ["UserRole"],
        }),

        // Get role by ID
        getRoleById: builder.query({
            query: (id) => `/role/${id}`,
            providesTags: (result, error, id) => [{ type: "UserRole", id }],
        }),

        // Create new role
        createRole: builder.mutation({
            query: (roleData) => ({
                url: "/role",
                method: "POST",
                body: roleData,
            }),
            invalidatesTags: ["UserRole"],
        }),

        // Update role
        updateRole: builder.mutation({
            query: ({ id, ...roleData }) => ({
                url: `/role/${id}`,
                method: "PUT",
                body: roleData,
            }),
            invalidatesTags: (result, error, { id }) => [
                "UserRole",
                { type: "UserRole", id },
            ],
        }),

        // Delete role
        deleteRole: builder.mutation({
            query: (id) => ({
                url: `/role/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["UserRole"],
        }),
    }),
});

export const {
    useGetRolesQuery,
    useGetRoleByIdQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
} = roleApi;