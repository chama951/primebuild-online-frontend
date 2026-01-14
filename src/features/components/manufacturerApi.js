import {baseApi} from "../../services/baseApi.js";


export const manufacturerApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getManufacturers: builder.query({
            query: () => "/manufacturer",
            providesTags: ["manufacturer"],
        }),

        saveManufacturer: builder.mutation({
            query: (manufacturer) => ({
                url: "/manufacturer",
                method: "POST",
                body: manufacturer,
            }),
            invalidatesTags: ["manufacturer"],
        }),

        updateManufacturer: builder.mutation({
            query: ({id, manufacturerName}) => ({
                url: `/manufacturer/${id}`,
                method: "PUT",
                body: {manufacturerName},
            }),
            invalidatesTags: ["manufacturer"],
        }),

        deleteManufacturer: builder.mutation({
            query: (id) => ({
                url: `/manufacturer/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["manufacturer"],
        }),
    }),
});

export const {
    useGetManufacturersQuery,
    useSaveManufacturerMutation,
    useUpdateManufacturerMutation,
    useDeleteManufacturerMutation,
} = manufacturerApi;
