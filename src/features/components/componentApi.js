import {baseApi} from "../../services/baseApi.js";

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
            query: ({id, componentName, buildComponent}) => ({
                url: `/component/${id}`,
                method: "PUT",
                body: {componentName, buildComponent},
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
    }),
});

export const {
    useGetComponentsQuery,
    useSaveComponentMutation,
    useUpdateComponentMutation,
    useDeleteComponentMutation,
} = componentApi;
