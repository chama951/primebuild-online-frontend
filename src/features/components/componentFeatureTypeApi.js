import {baseApi} from "../../services/baseApi.js";

export const componentFeatureTypeApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getComponentFeatureTypeById: builder.query({
            query: (id) => `/component_feature_type/${id}`,
            providesTags: (result, error, id) => [
                {type: 'ComponentFeatureType', id},
            ],
        }),

        getAllComponentFeatureTypes: builder.query({
            query: () => `/component_feature_type`,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({id}) => ({type: 'ComponentFeatureType', id})),
                        {type: 'ComponentFeatureType', id: 'LIST'},
                    ]
                    : [{type: 'ComponentFeatureType', id: 'LIST'}],
        }),

        createComponentFeatureType: builder.mutation({
            query: (data) => ({
                url: `/component_feature_type`,
                method: "POST",
                body: data, // This should send { componentId, featureTypeId }
            }),
            invalidatesTags: (result, error, data) => [
                {type: 'ComponentFeatureType', id: 'LIST'},
                {type: 'ComponentFeatureTypeByComponent', id: data.componentId},
            ],
        }),

        updateComponentFeatureType: builder.mutation({
            query: ({id, componentId, featureTypeName}) => ({
                url: `/featureType/${id}`,
                method: "PUT",
                body: {
                    featureTypeName,
                    componentId,
                },
            }),
            invalidatesTags: (result, error, {id, componentId}) => [
                {type: 'FeatureType', id},
                {type: 'ComponentFeatureTypeByComponent', id: componentId},
            ],
        }),

        deleteComponentFeatureType: builder.mutation({
            query: (id) => ({
                url: `/component_feature_type/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, id) => [
                {type: 'ComponentFeatureType', id},
                {type: 'ComponentFeatureType', id: 'LIST'},
            ],
        }),

        getComponentFeatureTypesByComponentId: builder.query(
            {
                query: (componentId) => `/component_feature_type?component=${componentId}`,
                providesTags: (result, error, componentId) =>
                    result
                        ? [
                            ...result.map(({id}) => ({type: 'ComponentFeatureType', id})),
                            {type: 'ComponentFeatureTypeByComponent', id: componentId},
                        ]
                        : [{type: 'ComponentFeatureTypeByComponent', id: componentId}],
            }),

        getComponentFeatureTypesByFeatureTypeId: builder.query({
            query: (featureTypeId) => `/component_feature_type?feature_type=${featureTypeId}`,
            providesTags: (result, error, featureTypeId) => [
                {type: 'ComponentFeatureTypeByFeatureType', id: featureTypeId},
            ],
        }),

    }),
});

export const {
    useCreateComponentFeatureTypeMutation,
    useDeleteComponentFeatureTypeMutation,
    useGetComponentFeatureTypesByComponentIdQuery,
} = componentFeatureTypeApi;