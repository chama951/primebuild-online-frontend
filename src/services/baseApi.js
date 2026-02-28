import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
    baseUrl: "http://localhost:8080/api",
    prepareHeaders: (headers) => {
        const token = localStorage.getItem("jwtToken");
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        headers.set("Content-Type", "application/json");
        return headers;
    },
});

const baseQueryWithAuthRedirect = async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    if (result.error) {
        const {status} = result.error;

        if (status === 401) {
            localStorage.removeItem("jwtToken");

            return {
                ...result,
                error: {
                    ...result.error,
                    isUnauthorized: true,
                },
            };
        }

        if (status === 403) {
            return {
                ...result,
                error: {
                    ...result.error,
                    isForbidden: true,
                },
            };
        }
    }

    return result;
};

export const baseApi = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithAuthRedirect,
    tagTypes: [
        "Component",
        "FeatureType",
        "ComponentFeatureType",
        "Item",
        "BuildItem",
        "Manufacturer",
        "User",
        "UserRole",
        "Build",
        "ItemComponentCount",
    ],
    endpoints: () => ({}),
});