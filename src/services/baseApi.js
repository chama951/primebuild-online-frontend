import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:8080/api",
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("jwtToken"); // use JWT from localStorage
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
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
        "ItemComponentCount"],
    endpoints: () => ({}),
});

