import {baseApi} from "./baseApi.js";

export const componentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getComponents: builder.query({
            query: () => "/component",
            providesTags: ["component"],
        }),

        saveComponent: builder.mutation({
            query: (component) => ({
                url: "/component",
                method: "POST",
                body: component,
            }),
            invalidatesTags: ["component"],
        }),

        updateComponent: builder.mutation({
            query: ({id, data}) => ({
                url: `/component/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["component"],
        }),

        deleteComponent: builder.mutation({
            query: (id) => ({
                url: `/component/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["component"],
        }),

        getBuildComponents: builder.query({
            query: (isBuild) => `component?isBuild=${isBuild}`,
            providesTags: (result, error, isBuild) => [
                {type: "ComponentsByIsBuild", id: isBuild},
            ],
        }),
    }),
});

export const {
    useGetComponentsQuery,
    useSaveComponentMutation,
    useUpdateComponentMutation,
    useDeleteComponentMutation,
    useGetBuildComponentsQuery
} = componentApi;
