//src/components/Header.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { useAuthContext } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

const Header = () => {
    const { isLoggedIn, user, logout: contextLogout, loading } = useAuthContext();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [incomingPendingCount, setIncomingPendingCount] = useState(0);
    const router = useRouter();

    const refreshConnectionSummary = async () => {
        if (!isLoggedIn) {
            setIncomingPendingCount(0);
            return;
        }

        try {
            const res = await axios.get("/api/connections/summary");
            setIncomingPendingCount(res.data.incomingPendingCount || 0);
        } catch {
            setIncomingPendingCount(0);
        }
    };

    useEffect(() => {
        if (loading || !isLoggedIn) {
            setIncomingPendingCount(0);
            return;
        }

        refreshConnectionSummary();

        const handleConnectionsChanged = () => {
            refreshConnectionSummary();
        };

        window.addEventListener("connections:changed", handleConnectionsChanged);
        return () => window.removeEventListener("connections:changed", handleConnectionsChanged);
    }, [isLoggedIn, loading]);

    const handleLogout = async () => {
        try {
            await axios.post("/api/auth/logout");
            contextLogout();
            setIncomingPendingCount(0);
            toast.success("Logged out successfully");
            setIsSidebarOpen(false);
            router.push("/login");
        } catch (error) {
            toast.error("Error logging out");
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => (
        <Link 
            href={href} 
            className="text-white font-medium text-lg hover:text-purple-200 transition-all duration-200 hover:scale-105 relative group"
            onClick={onClick}
        >
            {children}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-200 transition-all duration-200 group-hover:w-full"></span>
        </Link>
    );

    const ContactsBadge = () =>
        incomingPendingCount > 0 ? (
            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-pink-500 px-1.5 py-0.5 text-xs font-bold text-white">
                {incomingPendingCount > 9 ? "9+" : incomingPendingCount}
            </span>
        ) : null;

    if (loading) {
        return (
            <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#2d1b54]/95 to-[#7a4b94]/95 backdrop-blur-lg border-b border-white/10 shadow-lg">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="animate-pulse bg-white/20 h-12 w-48 rounded"></div>
                    <div className="animate-pulse bg-white/20 h-8 w-32 rounded"></div>
                </div>
            </header>
        );
    }

    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#2d1b54]/95 to-[#7a4b94]/95 backdrop-blur-lg border-b border-white/10 shadow-lg">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center hover:scale-105 transition-transform duration-200">
                    <Image src="/logo.png" alt="Skill Sync Logo" width={200} height={60} className="h-12 w-auto" />
                </Link>

                <nav className="hidden md:flex items-center space-x-8">
                    {isLoggedIn ? (
                        <>
                            <NavLink href="/dashboard">Dashboard</NavLink>
                            <NavLink href="/search">Search</NavLink>
                            <div className="flex items-center">
                                <NavLink href="/contacts">Contacts</NavLink>
                                <ContactsBadge />
                            </div>
                            <NavLink href="/study">Study</NavLink>
                            <Link href="/profile" className="hover:scale-105 transition-transform duration-200">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </Link>
                            <Button variant="outline" onClick={handleLogout} className="border-white/30 text-white hover:bg-white/10">
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <NavLink href="/">Home</NavLink>
                            <NavLink href="/about">About</NavLink>
                            <NavLink href="/features">Features</NavLink>
                            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                                <Link href="/login">Login</Link>
                            </Button>
                            <Button variant="primary">
                                <Link href="/signup">Sign Up</Link>
                            </Button>
                        </>
                    )}
                </nav>

                <button
                    className="md:hidden text-white focus:outline-none p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                    onClick={toggleSidebar}
                    aria-label="Toggle menu"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                        />
                    </svg>
                </button>
            </div>

            {/* Mobile Sidebar */}
            {isSidebarOpen && (
                <div className="md:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm">
                    <div className="w-80 bg-gradient-to-b from-[#2d1b54] to-[#7a4b94] h-full p-6 flex flex-col shadow-2xl">
                        <button
                            className="self-end text-white mb-6 p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
                            onClick={toggleSidebar}
                            aria-label="Close menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <nav className="flex flex-col space-y-6">
                            {isLoggedIn ? (
                                <>
                                    <div className="flex items-center space-x-3 p-4 bg-white/10 rounded-lg">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold">{user?.name}</p>
                                            <p className="text-purple-200 text-sm">{user?.email}</p>
                                        </div>
                                    </div>
                                    <NavLink href="/dashboard" onClick={() => setIsSidebarOpen(false)}>Dashboard</NavLink>
                                    <NavLink href="/search" onClick={() => setIsSidebarOpen(false)}>Search</NavLink>
                                    <div className="flex items-center">
                                        <NavLink href="/contacts" onClick={() => setIsSidebarOpen(false)}>Contacts</NavLink>
                                        <ContactsBadge />
                                    </div>
                                    <NavLink href="/study" onClick={() => setIsSidebarOpen(false)}>Study</NavLink>
                                    <NavLink href="/profile" onClick={() => setIsSidebarOpen(false)}>Profile</NavLink>
                                    <Button variant="outline" onClick={handleLogout} className="border-white/30 text-white hover:bg-white/10 mt-4">
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <NavLink href="/" onClick={() => setIsSidebarOpen(false)}>Home</NavLink>
                                    <NavLink href="/about" onClick={() => setIsSidebarOpen(false)}>About</NavLink>
                                    <NavLink href="/features" onClick={() => setIsSidebarOpen(false)}>Features</NavLink>
                                    <div className="space-y-3 mt-6">
                                        <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                                            <Link href="/login" onClick={() => setIsSidebarOpen(false)}>Login</Link>
                                        </Button>
                                        <Button variant="primary" className="w-full">
                                            <Link href="/signup" onClick={() => setIsSidebarOpen(false)}>Sign Up</Link>
                                        </Button>
                                    </div>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
