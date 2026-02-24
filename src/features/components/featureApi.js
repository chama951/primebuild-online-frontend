import {baseApi} from "../../services/baseApi.js";

export const featureApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getFeatures: builder.query({
            query: () => "/feature",
            providesTags: ["Feature"],
        }),

        getFeatureById: builder.query({
            query: (id) => `/feature/${id}`,
            providesTags: (result, error, id) => [{type: "Feature", id}],
        }),

        createFeature: builder.mutation({
            query: (data) => ({
                url: "/feature",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Feature"],
        }),

        updateFeature: builder.mutation({
            query: ({id, data}) => ({
                url: `/feature/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, {id}) => [{type: "Feature", id}],
        }),

        deleteFeature: builder.mutation({
            query: (id) => ({
                url: `/feature/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Feature"],
        }),

        getFeaturesByFeatureTypeId: builder.query({
            query: (featureTypeId) => `/feature?feature_type=${featureTypeId}`,
            providesTags: (result, error, featureTypeId) => [
                {type: "FeatureByFeatureType", id: featureTypeId},
            ],
        }),

        getFeaturesByComponentId: builder.query({
            query: (componentId) => `/feature?component=${componentId}`,
            providesTags: (result, error, componentId) => [
                {type: "FeatureByComponent", id: componentId},
            ],
        }),
    }),
});

export const {
    useGetFeaturesQuery,
    useCreateFeatureMutation,
    useUpdateFeatureMutation,
    useDeleteFeatureMutation,
} = featureApi;