// src/app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useAuthContext } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function LoginPage() {
    const [user, setUser] = useState({
        email: "",
        password: "",
    });
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuthContext();

    const handleLogin = async () => {
        try {
            setLoading(true);
            const response = await axios.post("/api/users/login", user);
            
            // Get user data from verify endpoint
            const verifyResponse = await axios.get("/api/auth/verify");
            if (verifyResponse.data.success) {
                login(verifyResponse.data.user);
                toast.success("Login successful");
                router.push(verifyResponse.data.user.isOnboarded ? "/dashboard" : "/onboarding");
            }
        } catch (error: any) {
            console.log("Error during login:", error.message);
            toast.error(error.response?.data?.error || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user.email.length > 0 && user.password.length > 0) {
            setButtonDisabled(false);
        } else {
            setButtonDisabled(true);
        }
    }, [user]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md p-8" gradient>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-purple-200">Sign in to your account</p>
                </div>

                <div className="space-y-6">
                    <Input
                        type="email"
                        label="Email"
                        placeholder="Enter your email"
                        value={user.email}
                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                        icon={
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                        }
                    />

                    <Input
                        type="password"
                        label="Password"
                        placeholder="Enter your password"
                        value={user.password}
                        onChange={(e) => setUser({ ...user, password: e.target.value })}
                        icon={
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        }
                    />

                    <Button
                        onClick={handleLogin}
                        disabled={buttonDisabled || loading}
                        loading={loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-purple-200">
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-white font-semibold hover:text-purple-200 transition-colors duration-200">
                            Sign up
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
