import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const OAuth2Success = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            localStorage.setItem("jwtToken", token);
            navigate("/dashboard");
        } else {
            navigate("/login");
        }
    }, []);

    return <div>Logging you in...</div>;
};

export default OAuth2Success;
