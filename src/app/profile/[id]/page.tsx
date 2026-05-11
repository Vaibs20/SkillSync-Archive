"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuthContext } from "@/context/AuthContext";

type RelationshipStatus = "none" | "pending_sent" | "pending_received" | "connected" | "declined" | "cancelled";

interface PublicProfile {
    _id: string;
    id?: string;
    name: string;
    email?: string;
    branch?: string;
    passing_year?: number | null;
    known_skills?: string[];
    career_path?: string[];
    learning_goal?: string;
    availability?: string;
}

const notifyConnectionsChanged = () => {
    window.dispatchEvent(new Event("connections:changed"));
};

const getParamValue = (value: string | string[] | undefined) => {
    if (Array.isArray(value)) return value[0];
    return value || "";
};

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const profileId = getParamValue(params.id as string | string[] | undefined);
    const { user, isLoggedIn, loading: authLoading } = useAuthContext();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>("none");
    const [requestId, setRequestId] = useState("");

    const isOwnProfile = Boolean(user?.id && profileId && user.id === profileId);

    const loadRelationshipStatus = async () => {
        if (!profileId || isOwnProfile) {
            setRelationshipStatus("none");
            setRequestId("");
            return;
        }

        const params = new URLSearchParams({ peerIds: profileId });
        const res = await axios.get(`/api/connections/status?${params.toString()}`);
        setRelationshipStatus(res.data.statuses?.[profileId] || "none");
        setRequestId(res.data.requestIds?.[profileId] || "");
    };

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push("/login");
        }
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (authLoading || !isLoggedIn || !profileId) {
            return;
        }

        const loadProfile = async () => {
            setPageLoading(true);
            try {
                const res = await axios.get(`/api/users/${profileId}`);
                setProfile(res.data);
                await loadRelationshipStatus();
            } catch (error: any) {
                toast.error(error.response?.data?.error || "Unable to load profile");
            } finally {
                setPageLoading(false);
            }
        };

        loadProfile();
    }, [authLoading, isLoggedIn, profileId, isOwnProfile]);

    const sendConnectionRequest = async () => {
        setActionLoading(true);
        try {
            await axios.post("/api/connections/requests", { recipientId: profileId });
            setRelationshipStatus("pending_sent");
            toast.success("Connection request sent");
            notifyConnectionsChanged();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Unable to send request");
            await loadRelationshipStatus();
        } finally {
            setActionLoading(false);
        }
    };

    const acceptConnectionRequest = async () => {
        if (!requestId) {
            toast.error("Request details are no longer available");
            await loadRelationshipStatus();
            return;
        }

        setActionLoading(true);
        try {
            await axios.patch(`/api/connections/requests/${requestId}`, { action: "accept" });
            setRelationshipStatus("connected");
            toast.success("Connection accepted");
            notifyConnectionsChanged();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Unable to accept request");
            await loadRelationshipStatus();
        } finally {
            setActionLoading(false);
        }
    };

    const renderConnectionAction = () => {
        if (isOwnProfile) {
            return (
                <Link
                    href="/profile"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 font-medium text-white shadow-lg hover:from-indigo-700 hover:to-purple-700"
                >
                    Edit Profile
                </Link>
            );
        }

        if (relationshipStatus === "connected") {
            return (
                <div className="space-y-3">
                    <Button variant="secondary" disabled className="w-full">
                        Connected
                    </Button>
                    <Button variant="outline" disabled className="w-full border-white/30 text-white">
                        Chat coming soon
                    </Button>
                </div>
            );
        }

        if (relationshipStatus === "pending_sent") {
            return (
                <Button variant="outline" disabled className="w-full border-white/30 text-white">
                    Pending
                </Button>
            );
        }

        if (relationshipStatus === "pending_received") {
            return (
                <Button loading={actionLoading} onClick={acceptConnectionRequest} className="w-full">
                    Accept Request
                </Button>
            );
        }

        return (
            <Button
                variant="outline"
                loading={actionLoading}
                onClick={sendConnectionRequest}
                className="w-full border-white/30 text-white hover:bg-white/10"
            >
                Connect
            </Button>
        );
    };

    if (authLoading || pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-5xl mx-auto">
                <Card className="p-8" gradient>
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold">
                                    {profile.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                                    <p className="text-purple-200">{profile.email || "No email provided"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                                <div className="rounded-lg bg-white/10 p-4">
                                    <p className="text-purple-200 mb-1">Department</p>
                                    <p className="text-white font-semibold">{profile.branch || "N/A"}</p>
                                </div>
                                <div className="rounded-lg bg-white/10 p-4">
                                    <p className="text-purple-200 mb-1">Graduation Year</p>
                                    <p className="text-white font-semibold">{profile.passing_year || "N/A"}</p>
                                </div>
                                <div className="rounded-lg bg-white/10 p-4 md:col-span-2">
                                    <p className="text-purple-200 mb-1">Learning Goal</p>
                                    <p className="text-white font-semibold">{profile.learning_goal || "N/A"}</p>
                                </div>
                                <div className="rounded-lg bg-white/10 p-4">
                                    <p className="text-purple-200 mb-2">Skills</p>
                                    <p className="text-white font-semibold">
                                        {profile.known_skills?.join(", ") || "None listed"}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-white/10 p-4">
                                    <p className="text-purple-200 mb-2">Career Path</p>
                                    <p className="text-white font-semibold">
                                        {profile.career_path?.join(", ") || "None listed"}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-white/10 p-4 md:col-span-2">
                                    <p className="text-purple-200 mb-1">Availability</p>
                                    <p className="text-white font-semibold">{profile.availability || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        <aside className="w-full lg:w-72">
                            <div className="rounded-lg bg-white/10 p-5">
                                <h2 className="text-xl font-semibold text-white mb-4">Connection</h2>
                                {renderConnectionAction()}
                            </div>
                        </aside>
                    </div>
                </Card>
            </div>
        </div>
    );
}
