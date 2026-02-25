import {baseApi} from "../../services/baseApi.js";

export const buildApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getBuilds: builder.query({
            query: () => "/build?user=all",
            providesTags: ["Build"],
        }),

        getCurrentUserBuilds: builder.query({
            query: () => "/build?user=current",
            providesTags: ["Build"],
        }),

        getStaffMadeBuilds: builder.query({
            query: () => "/build?user=staff",
            providesTags: ["Build"],
        }),

        getBuildById: builder.query({
            query: (id) => `/build/${id}`,
            providesTags: (result, error, id) => [{type: "Build", id}],
        }),

        createBuild: builder.mutation({
            query: (data) => ({
                url: "/build",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Build"],
        }),

        updateBuild: builder.mutation({
            query: (data) => ({
                url: `/build/${data.id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Build"],
        }),

        getDraftBuilds: builder.query({
            query: () => "/build?status=DRAFT",
            providesTags: ["Build"],
        }),

        deleteBuild: builder.mutation({
            query: (id) => ({
                url: `/build/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Build"],
        }),

    }),
});

export const {
    useGetStaffMadeBuildsQuery,
    useGetBuildsQuery,
    useGetCurrentUserBuildsQuery,
    useGetBuildByIdQuery,
    useCreateBuildMutation,
    useUpdateBuildMutation,
    useDeleteBuildMutation,
    useGetDraftBuildsQuery,
} = buildApi;