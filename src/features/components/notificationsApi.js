import { baseApi } from "../../services/baseApi.js";

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

    }),
});

export const {
    useGetNotificationsQuery,
    useReadNotificationsMutation,
} = notificationsApi;