// src/app/signup/page.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useAuthContext } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function SignupPage() {
    const router = useRouter();
    const { login } = useAuthContext();
    const [user, setUser] = React.useState({
        name: "",
        email: "",
        password: "",
    });
    const [buttonDisabled, setButtonDisabled] = React.useState(true);
    const [loading, setLoading] = React.useState(false);

    const handleSignup = async () => {
        try {
            setLoading(true);
            const signupResponse = await axios.post("/api/users/signup", user);
            console.log("Signup response:", signupResponse.data);

            // Automatically log in
            const loginResponse = await axios.post("/api/users/login", {
                email: user.email,
                password: user.password,
            });
            
            // Get user data and update context
            const verifyResponse = await axios.get("/api/auth/verify");
            if (verifyResponse.data.success) {
                login(verifyResponse.data.user);
                toast.success("Account created successfully!");
                router.push("/onboarding");
            }
        } catch (err: any) {
            console.error("Error:", err.response?.data || err);
            toast.error(err.response?.data?.error || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user.email.length > 0 && user.password.length > 0 && user.name.length > 0) {
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
                        Join SkillSync
                    </h2>
                    <p className="text-purple-200">Create your account to get started</p>
                </div>

                <div className="space-y-6">
                    <Input
                        type="text"
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={user.name}
                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                        icon={
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        }
                    />

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
                        placeholder="Create a password"
                        value={user.password}
                        onChange={(e) => setUser({ ...user, password: e.target.value })}
                        icon={
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        }
                    />

                    <Button
                        onClick={handleSignup}
                        disabled={buttonDisabled || loading}
                        loading={loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-purple-200">
                        Already have an account?{" "}
                        <Link href="/login" className="text-white font-semibold hover:text-purple-200 transition-colors duration-200">
                            Sign in
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
