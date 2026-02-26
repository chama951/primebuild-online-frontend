import {baseApi} from "./baseApi.js";

export const featureTypeApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getFeatureTypes: builder.query({
            query: () => "/feature_type",
            providesTags: ["FeatureType"],
        }),

        getFeatureTypesByComponent: builder.query({
            query: (componentId) => `/feature_type?component=${componentId}`,
            providesTags: (result, error, componentId) => [
                {type: "FeatureTypeByComponent", id: componentId},
            ],
        }),

        saveFeatureType: builder.mutation({
            query: (featureType) => ({
                url: "/feature_type",
                method: "POST",
                body: featureType,
            }),
            invalidatesTags: ["FeatureType"],
        }),

        updateFeatureType: builder.mutation({
            query: ({id, featureTypeName, componentId}) => ({
                url: `/feature_type/${id}`,
                method: "PUT",
                body: {
                    featureTypeName,
                    componentId,
                },
            }),
            invalidatesTags: (result, error, {id, componentId}) => [
                "FeatureType",
                {type: "FeatureType", id},
                {type: "FeatureTypeByComponent", id: componentId},
            ],
        }),

        deleteFeatureType: builder.mutation({
            query: (id) => ({
                url: `/feature_type/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, {componentId}) => [
                "FeatureType",
                {type: "FeatureType", id: "LIST"},
                {type: "FeatureTypeByComponent", id: componentId},
            ],
        }),

    }),
});


export const {
    useGetFeatureTypesQuery,
    useSaveFeatureTypeMutation,
    useUpdateFeatureTypeMutation,
    useDeleteFeatureTypeMutation,
} = featureTypeApi;
