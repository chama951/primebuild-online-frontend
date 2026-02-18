import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLoginMutation } from "../components/authApi.js";
import Signup from "./Signup.jsx";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showSignup, setShowSignup] = useState(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [login, { isLoading }] = useLoginMutation();

    // Handle OAuth2 token redirect
    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            localStorage.setItem("jwtToken", token);
            navigate("/item");
        }
    }, [searchParams, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const data = await login({ username, password }).unwrap();
            localStorage.setItem("jwtToken", data.jwtToken);
            localStorage.setItem("username", data.username);
            localStorage.setItem("roles", JSON.stringify(data.roles));
            navigate("/item");
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
                {success && <p className="text-green-500 text-center">{success}</p>}

                {showSignup ? (
                    <Signup onSuccess={(msg) => { setShowSignup(false); setSuccess(msg); }} />
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
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            {isLoading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                )}

                <div className="text-center mt-4">
                    <button
                        onClick={() => { setShowSignup(!showSignup); setError(""); setSuccess(""); }}
                        className="text-blue-600 hover:underline text-sm"
                    >
                        {showSignup
                            ? "Already have an account? Login"
                            : "Don't have an account? Signup"}
                    </button>
                </div>

                {!showSignup && (
                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t"></div>
                        <div className="flex-grow border-t"></div>
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2 mt-4"
                        >
                            <img
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                alt="Google"
                                className="w-5 h-5"
                            />
                            Continue with Google
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
