import {baseApi} from "./baseApi.js";

export const roleApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getRoles: builder.query({
            query: () => "/role",
            providesTags: ["UserRole"],
        }),

        getRoleById: builder.query({
            query: (id) => `/role/${id}`,
            providesTags: (result, error, id) => [{type: "UserRole", id}],
        }),

        createRole: builder.mutation({
            query: (roleData) => ({
                url: "/role",
                method: "POST",
                body: roleData,
            }),
            invalidatesTags: ["UserRole"],
        }),

        updateRole: builder.mutation({
            query: ({id, ...roleData}) => ({
                url: `/role/${id}`,
                method: "PUT",
                body: roleData,
            }),
            invalidatesTags: (result, error, {id}) => [
                "UserRole",
                {type: "UserRole", id},
            ],
        }),

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