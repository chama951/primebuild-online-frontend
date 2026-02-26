import {baseApi} from "./baseApi.js";

export const compatibilityApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getCompatibleItemsByComponent: builder.query({
            query: ({componentId, selectedItems}) => {
                const body = {
                    itemList: selectedItems?.map((i) => ({id: i.id})) || [],
                };

                console.log("Sending to backend:", {componentId, body});

                return {
                    url: `/compatibility`,
                    params: {component: componentId},
                    method: 'POST',
                    body,
                };
            },
            providesTags: (result, error, {componentId}) => [
                {type: 'CompatibleItems', id: componentId}
            ],
        }),

        getCompatiblePowerSources: builder.query({
            query: ({componentId, selectedItems}) => {
                const body = {
                    itemList: selectedItems?.map((i) => ({id: i.id})) || [],
                };

                console.log("Sending to backend (power sources):", {componentId, body});

                return {
                    url: `/compatibility/power_source`,
                    params: {component: componentId},
                    method: 'POST',
                    body,
                };
            },
            providesTags: (result, error, {componentId}) => [
                {type: 'CompatibleItems', id: componentId}
            ],
        }),

    }),
});

export const {
    useGetCompatibleItemsByComponentQuery,
    useGetCompatiblePowerSourcesQuery,
} = compatibilityApi;