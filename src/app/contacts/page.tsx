"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type Contact = {
    id: string;
    name?: string;
    email?: string;
    branch?: string;
    known_skills?: string[];
};

type ConnectionRequest = {
    id: string;
    name?: string;
    email?: string;
    requestedAt?: string;
};

export default function Contacts() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [requests, setRequests] = useState<ConnectionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadConnections = async () => {
        try {
            const res = await axios.get("/api/users/connections");
            setContacts(res.data.contacts || []);
            setRequests(res.data.requests || []);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
            toast.error(message || "Unable to load connections");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConnections();
    }, []);

    const handleRespond = async (requesterId: string, action: "accept" | "decline") => {
        try {
            setProcessingId(requesterId);
            const response = await axios.post("/api/users/connect/respond", { requesterId, action });
            toast.success(response.data.message);
            await loadConnections();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
            toast.error(message || "Unable to update request");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="flex-1 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white">Contacts</h1>
                    <p className="mt-2 text-purple-200">Manage your study network and pending invitations.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6" gradient>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold text-white">Connection Requests</h2>
                        {loading && <span className="text-sm text-purple-200">Loading...</span>}
                    </div>
                    {requests.length === 0 && !loading ? (
                        <p className="text-purple-200">No pending requests right now.</p>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((req) => (
                                <div
                                    key={req.id}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-lg bg-white/10 border border-white/20"
                                >
                                    <div>
                                        <p className="text-white font-semibold">{req.name || "Unknown user"}</p>
                                        <p className="text-purple-200 text-sm">{req.email}</p>
                                        {req.requestedAt && (
                                            <p className="text-purple-300 text-xs mt-1">
                                                Requested on {new Date(req.requestedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleRespond(req.id, "accept")}
                                            loading={processingId === req.id}
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-white border border-white/30"
                                            onClick={() => handleRespond(req.id, "decline")}
                                            loading={processingId === req.id}
                                        >
                                            Decline
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card className="p-6" gradient>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-semibold text-white">Your Contacts</h2>
                        {loading && <span className="text-sm text-purple-200">Loading...</span>}
                    </div>
                    {contacts.length === 0 && !loading ? (
                        <p className="text-purple-200">You have not connected with anyone yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="p-4 rounded-lg bg-white/10 border border-white/20"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-semibold">{contact.name}</p>
                                            <p className="text-purple-200 text-sm">{contact.email}</p>
                                        </div>
                                        <span className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                                            {contact.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-purple-200 text-sm">
                                        <p>
                                            <strong className="text-white">Branch:</strong>{" "}
                                            {contact.branch || "Not specified"}
                                        </p>
                                        <p>
                                            <strong className="text-white">Skills:</strong>{" "}
                                            {contact.known_skills?.length
                                                ? contact.known_skills.join(", ")
                                                : "Not added"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
