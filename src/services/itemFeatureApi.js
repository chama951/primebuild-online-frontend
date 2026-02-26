import {baseApi} from "./baseApi.js";

export const itemFeatureApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getItemFeatures: builder.query({
            query: () => "/item_feature",
            providesTags: ["ItemFeature"],
        }),

        getItemFeatureById: builder.query({
            query: (id) => `/item_feature/${id}`,
            providesTags: (result, error, id) => [{type: "ItemFeature", id}],
        }),

        createItemFeature: builder.mutation({
            query: ({itemId, featureId, slotCount}) => ({
                url: "/item_feature",
                method: "POST",
                body: {itemId, featureId, slotCount},
            }),
            invalidatesTags: ["ItemFeature"],
        }),

        updateItemFeature: builder.mutation({
            query: ({id, itemId, featureId, slotCount}) => ({
                url: `/item_feature/${id}`,
                method: "PUT",
                body: {itemId, featureId, slotCount},
            }),
            invalidatesTags: (result, error, {id}) => [{type: "ItemFeature", id}],
        }),

        deleteItemFeature: builder.mutation({
            query: (id) => ({
                url: `/item_feature/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["ItemFeature"],
        }),

        getItemFeaturesByItemId: builder.query({
            query: (itemId) => `/item_feature?item=${itemId}`,
            providesTags: (result, error, itemId) => [
                {type: "ItemFeatureByItem", id: itemId},
            ],
        }),

        getItemFeaturesByFeatureId: builder.query({
            query: (featureId) => `/item_feature?feature=${featureId}`,
            providesTags: (result, error, featureId) => [
                {type: "ItemFeatureByFeature", id: featureId},
            ],
        }),
    }),
});

export const {
    useGetItemFeaturesQuery,
    useCreateItemFeatureMutation,
    useDeleteItemFeatureMutation,
    useUpdateItemFeatureMutation
} = itemFeatureApi;