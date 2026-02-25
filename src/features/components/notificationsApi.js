import {baseApi} from "../../services/baseApi.js";

export const notificationsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({

        getNotifications: builder.query({
            query: () => "/notification",
            providesTags: ["Notification"],
        }),

        readNotifications: builder.mutation({
            query: (data) => ({
                url: "/notification",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Notification"],
        }),

        deleteAllNotifications: builder.mutation({
            query: () => ({
                url: "/notification",
                method: "DELETE",
            }),
            invalidatesTags: ["Notification"],
        }),

    }),
});

export const {
    useGetNotificationsQuery,
    useReadNotificationsMutation,
    useDeleteAllNotificationsMutation,
} = notificationsApi;