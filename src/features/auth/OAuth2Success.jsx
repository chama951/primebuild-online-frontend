import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const OAuth2Success = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");
        const username = searchParams.get("username");
        const roles = searchParams.get("roles")?.split(",") || [];
        const redirectUrl = searchParams.get("redirectUrl"); // <-- backend provides full URL

        if (token) {
            // Store JWT and user info
            localStorage.setItem("jwtToken", token);
            localStorage.setItem("username", username);
            localStorage.setItem("roles", JSON.stringify(roles));

            // Redirect using backend-provided URL
            if (redirectUrl) {
                window.location.href = redirectUrl;
            }
        } else {
            window.location.href = "/login";
        }
    }, [searchParams]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-700 text-lg">Logging you in...</p>
        </div>
    );
};

export default OAuth2Success;