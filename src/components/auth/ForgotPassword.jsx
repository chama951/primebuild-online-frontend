import React, { useState } from "react";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../../services/UserApi.js";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [pin, setPin] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const [forgotPassword, { isLoading: sending }] = useForgotPasswordMutation();
    const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();

    const handleSendPin = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        try {
            const res = await forgotPassword(email).unwrap();
            setMessage(res.message);
            setStep(2);
        } catch (err) {
            setError(err?.data?.message || "Failed to send PIN");
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        try {
            const res = await resetPassword({
                email,
                pin,
                newPassword
            }).unwrap();

            setMessage(res.message);
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setError(err?.data?.message || "Reset failed");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">
                    Forgot Password
                </h2>

                {error && <p className="text-red-500 text-center">{error}</p>}
                {message && <p className="text-green-500 text-center">{message}</p>}

                {step === 1 && (
                    <form onSubmit={handleSendPin} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg"
                        />

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            {sending ? "Sending..." : "Send PIN"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg"
                        />

                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-lg"
                        />

                        <button
                            type="submit"
                            disabled={resetting}
                            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            {resetting ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
