// src/app/profile/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type ConnectionRequest = {
    from?: string;
};

type ProfileUser = {
    _id: string;
    name: string;
    email: string;
    branch?: string;
    known_skills?: string[];
    learning_goal?: string;
    contacts?: string[];
    connectionRequests?: ConnectionRequest[];
};

type ConnectionMeta = {
    requests: { id: string }[];
};

const ProfileView = () => {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileUser | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [status, setStatus] = useState<"self" | "connected" | "pending" | "respond" | "none">("none");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const profileId = useMemo(() => params?.id?.toString(), [params?.id]);

    useEffect(() => {
        const fetchData = async () => {
            if (!profileId) return;
            try {
                const verifyRes = await axios.get("/api/auth/verify");
                if (!verifyRes.data.success) {
                    router.push("/login");
                    return;
                }
                const viewerId = verifyRes.data.user.id;
                setCurrentUserId(viewerId);

                if (viewerId === profileId) {
                    router.push("/profile");
                    return;
                }

                const [profileRes, connectionRes] = await Promise.all([
                    axios.get(`/api/users/${profileId}`),
                    axios.get<ConnectionMeta>("/api/users/connections"),
                ]);

                setProfile(profileRes.data);

                const isConnected = profileRes.data.contacts?.some(
                    (id: string) => id?.toString() === viewerId
                );
                if (isConnected) {
                    setStatus("connected");
                    return;
                }

                const outboundPending = profileRes.data.connectionRequests?.some(
                    (req: ConnectionRequest) => req.from?.toString() === viewerId
                );
                if (outboundPending) {
                    setStatus("pending");
                    return;
                }

                const inboundPending = connectionRes.data.requests?.some(
                    (req) => req.id?.toString() === profileId
                );
                if (inboundPending) {
                    setStatus("respond");
                    return;
                }

                setStatus("none");
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
                toast.error(message || "Unable to load profile");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profileId, router]);

    const handleConnect = async () => {
        if (!profileId) return;
        try {
            setActionLoading(true);
            const response = await axios.post("/api/users/connect/request", {
                targetUserId: profileId,
            });
            toast.success(response.data.message || "Request sent");
            setStatus("pending");
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
            toast.error(message || "Failed to send request");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRespond = async (action: "accept" | "decline") => {
        if (!profileId) return;
        try {
            setActionLoading(true);
            const response = await axios.post("/api/users/connect/respond", {
                requesterId: profileId,
                action,
            });
            toast.success(response.data.message);
            setStatus(action === "accept" ? "connected" : "none");
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
            toast.error(message || "Unable to update request");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <Card className="p-10 w-full max-w-2xl">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-white/40 rounded"></div>
                        <div className="h-24 bg-white/40 rounded"></div>
                        <div className="h-6 bg-white/40 rounded w-1/2"></div>
                    </div>
                </Card>
            </div>
        );
    }

    if (!profile || !currentUserId) {
        return (
            <div className="flex-1 flex items-center justify-center p-6">
                <Card className="p-10 w-full max-w-xl text-center">
                    <p className="text-lg text-white">Profile not found.</p>
                    <Button className="mt-4" onClick={() => router.push("/search")}>
                        Back to search
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 flex items-start justify-center">
            <Card className="p-10 w-full max-w-3xl" gradient>
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {profile.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                                <p className="text-purple-200">{profile.email}</p>
                            </div>
                            {status !== "self" && (
                                <div className="flex items-center gap-3">
                                    {status === "connected" && (
                                        <span className="px-3 py-2 rounded-lg bg-green-500/20 text-green-200 font-semibold">
                                            Connected
                                        </span>
                                    )}
                                    {status === "pending" && (
                                        <span className="px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-200 font-semibold">
                                            Request sent
                                        </span>
                                    )}
                                    {status === "respond" && (
                                        <>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                loading={actionLoading}
                                                onClick={() => handleRespond("accept")}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                loading={actionLoading}
                                                onClick={() => handleRespond("decline")}
                                                className="text-white border border-white/30"
                                            >
                                                Decline
                                            </Button>
                                        </>
                                    )}
                                    {status === "none" && (
                                        <Button
                                            onClick={handleConnect}
                                            loading={actionLoading}
                                            className="min-w-[160px]"
                                        >
                                            Connect
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-white/10 border border-white/20">
                                <p className="text-sm text-purple-200">Branch</p>
                                <p className="text-white font-semibold">{profile.branch || "Not specified"}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-white/10 border border-white/20">
                                <p className="text-sm text-purple-200">Skills</p>
                                <p className="text-white font-semibold">
                                    {profile.known_skills?.length ? profile.known_skills.join(", ") : "Not added"}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-white/10 border border-white/20">
                            <p className="text-sm text-purple-200">Learning goal</p>
                            <p className="text-white font-semibold">{profile.learning_goal || "Not provided"}</p>
                        </div>

                        {status === "respond" && (
                            <p className="text-yellow-200 text-sm">
                                This user requested to connect with you. Respond to add them to your contacts.
                            </p>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ProfileView;
