import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

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

        try {
            const res = await fetch("http://localhost:8080/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                throw new Error("Invalid credentials");
            }

            const data = await res.json();

            localStorage.setItem("jwtToken", data.jwtToken);
            localStorage.setItem("username", data.username);
            localStorage.setItem("roles", JSON.stringify(data.roles));

            navigate("/item");
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href =
            "http://localhost:8080/oauth2/authorization/google";
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">

                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    Login
                </h1>

                {error && (
                    <p className="text-red-500 text-center mb-4">{error}</p>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Login
                    </button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t"></div>
                    <span className="mx-3 text-sm text-gray-500">OR</span>
                    <div className="flex-grow border-t"></div>
                </div>

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

            </div>
        </div>
    );
}
