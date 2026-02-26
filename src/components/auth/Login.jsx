import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../services/authApi.js";
import Signup from "./Signup.jsx";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showSignup, setShowSignup] = useState(false);

    const navigate = useNavigate();
    const [login, { isLoading }] = useLoginMutation();

    // Handle OAuth2 redirect via backend-provided query params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const usernameParam = params.get("username");
        const rolesParam = params.get("roles")?.split(",") || [];
        const redirectUrl = params.get("redirectUrl"); // backend can provide full redirect URL

        if (token) {
            localStorage.setItem("jwtToken", token);
            localStorage.setItem("username", usernameParam);
            localStorage.setItem("roles", JSON.stringify(rolesParam));

            // Redirect to backend-provided URL if available
            if (redirectUrl) {
                window.location.href = redirectUrl;
            }
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const data = await login({ username, password }).unwrap();

            localStorage.setItem("jwtToken", data.jwtToken);
            localStorage.setItem("username", data.username);
            localStorage.setItem("roles", JSON.stringify(data.roles));

            // Redirect using backend-provided URL
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            }
        } catch (err) {
            setError(err.data?.message || "Login failed");
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8080/oauth2/authorization/google";
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    {showSignup ? "Signup" : "Login"}
                </h1>

                {error && <p className="text-red-500 text-center">{error}</p>}

                {showSignup ? (
                    <Signup onSuccess={() => setShowSignup(false)} />
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => navigate("/forgot-password")}
                                className="text-sm text-blue-600 hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            {isLoading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                )}

                {!showSignup && (
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
                        >
                            <img
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                alt="Google"
                                className="w-5 h-5"
                            />
                            Continue with Google
                        </button>

                        <button
                            onClick={() => setShowSignup(!showSignup)}
                            className="text-blue-600 hover:underline text-sm"
                        >
                            {showSignup
                                ? "Already have an account? Login"
                                : "Don't have an account? Signup"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}