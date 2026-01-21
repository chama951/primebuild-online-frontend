import {baseApi} from "../../services/baseApi";

export const compatibilityApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getCompatibleItemsByComponent: builder.query({
            query: ({ componentId, selectedItems }) => {
                console.log('Sending to backend:', {
                    componentId,
                    itemListCount: selectedItems?.length || 0,
                    selectedItems
                });

                return {
                    url: `/compatibility`,
                    params: { component: componentId },
                    method: 'POST',
                    body: {
                        itemList: selectedItems || [] // Send full item objects
                    }
                };
            },
            providesTags: (result, error, { componentId }) => [
                { type: 'CompatibleItems', id: componentId }
            ],
        }),

        getCompatiblePowerSources: builder.query({
            query: ({ componentId, selectedItems }) => {
                console.log('Sending to backend:', {
                    componentId,
                    itemListCount: selectedItems?.length || 0,
                    selectedItems
                });

                return {
                    url: `/compatibility/power_source`,
                    params: { component: componentId },
                    method: 'POST',
                    body: {
                        itemList: selectedItems || [] // Send full item objects
                    }
                };
            },
            providesTags: (result, error, { componentId }) => [
                { type: 'CompatibleItems', id: componentId }
            ],
        }),
    }),
});

export const {
    useGetCompatibleItemsByComponentQuery,
    useGetCompatiblePowerSourcesQuery,
} = compatibilityApi;