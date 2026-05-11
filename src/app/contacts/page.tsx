"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuthContext } from "@/context/AuthContext";

interface SafeUser {
    _id: string;
    id?: string;
    name: string;
    email?: string;
    branch?: string;
    known_skills?: string[];
    learning_goal?: string;
}

interface ConnectionRequest {
    id: string;
    status: "pending" | "accepted" | "declined" | "cancelled";
    peer: SafeUser;
    requestedAt?: string;
}

interface NetworkConnection {
    connectionId: string;
    peer: SafeUser;
    connectedAt?: string;
    chatAvailable: boolean;
}

type Tab = "incoming" | "sent" | "network";

const notifyConnectionsChanged = () => {
    window.dispatchEvent(new Event("connections:changed"));
};

const getPeerId = (peer: SafeUser) => peer?._id || peer?.id || "";

export default function Contacts() {
    const router = useRouter();
    const { isLoggedIn, loading: authLoading } = useAuthContext();
    const [activeTab, setActiveTab] = useState<Tab>("incoming");
    const [pageLoading, setPageLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
    const [connections, setConnections] = useState<NetworkConnection[]>([]);

    const loadContacts = async () => {
        setPageLoading(true);
        try {
            const [incomingRes, outgoingRes, connectionsRes] = await Promise.all([
                axios.get("/api/connections/requests?box=incoming"),
                axios.get("/api/connections/requests?box=outgoing"),
                axios.get("/api/connections"),
            ]);

            setIncomingRequests((incomingRes.data.requests || []).filter((request: ConnectionRequest) => request.status === "pending"));
            setSentRequests((outgoingRes.data.requests || []).filter((request: ConnectionRequest) => request.status === "pending"));
            setConnections(connectionsRes.data.connections || []);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Unable to load contacts");
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push("/login");
        }
    }, [authLoading, isLoggedIn, router]);

    useEffect(() => {
        if (!authLoading && isLoggedIn) {
            loadContacts();
        }
    }, [authLoading, isLoggedIn]);

    const updateRequest = async (requestId: string, action: "accept" | "decline" | "cancel") => {
        setActionLoading((prev) => ({ ...prev, [requestId]: true }));
        try {
            await axios.patch(`/api/connections/requests/${requestId}`, { action });
            toast.success(
                action === "accept"
                    ? "Connection accepted"
                    : action === "decline"
                      ? "Connection request declined"
                      : "Connection request cancelled"
            );
            notifyConnectionsChanged();
            await loadContacts();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Unable to update request");
        } finally {
            setActionLoading((prev) => ({ ...prev, [requestId]: false }));
        }
    };

    const renderPeerSummary = (peer: SafeUser) => (
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                {peer?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
                <h3 className="text-white font-semibold">{peer?.name || "Unknown user"}</h3>
                <p className="text-purple-200 text-sm">{peer?.branch || peer?.email || "SkillSync member"}</p>
            </div>
        </div>
    );

    const renderEmptyState = (title: string, body: string) => (
        <Card className="p-10 text-center" gradient>
            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
            <p className="text-purple-200">{body}</p>
        </Card>
    );

    if (authLoading || pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Contacts</h1>
                    <p className="text-purple-200 text-lg">Manage requests and keep track of your SkillSync network.</p>
                </div>

                <Card className="p-6 mb-8" gradient>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant={activeTab === "incoming" ? "primary" : "ghost"}
                            onClick={() => setActiveTab("incoming")}
                            className="text-white"
                        >
                            Incoming Requests ({incomingRequests.length})
                        </Button>
                        <Button
                            variant={activeTab === "sent" ? "primary" : "ghost"}
                            onClick={() => setActiveTab("sent")}
                            className="text-white"
                        >
                            Sent Requests ({sentRequests.length})
                        </Button>
                        <Button
                            variant={activeTab === "network" ? "primary" : "ghost"}
                            onClick={() => setActiveTab("network")}
                            className="text-white"
                        >
                            My Network ({connections.length})
                        </Button>
                    </div>
                </Card>

                {activeTab === "incoming" && (
                    <div className="space-y-4">
                        {incomingRequests.length === 0
                            ? renderEmptyState("No incoming requests", "New connection requests will appear here.")
                            : incomingRequests.map((request) => (
                                  <Card key={request.id} className="p-5" gradient>
                                      <div className="flex flex-col md:flex-row md:items-center gap-5">
                                          <div className="flex-1">{renderPeerSummary(request.peer)}</div>
                                          <div className="flex flex-col sm:flex-row gap-3 md:w-auto">
                                              <Link
                                                  href={`/profile/${getPeerId(request.peer)}`}
                                                  className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 px-4 py-2 font-medium text-white hover:bg-white/10"
                                              >
                                                  View Profile
                                              </Link>
                                              <Button
                                                  loading={Boolean(actionLoading[request.id])}
                                                  onClick={() => updateRequest(request.id, "accept")}
                                              >
                                                  Accept
                                              </Button>
                                              <Button
                                                  variant="danger"
                                                  loading={Boolean(actionLoading[request.id])}
                                                  onClick={() => updateRequest(request.id, "decline")}
                                              >
                                                  Decline
                                              </Button>
                                          </div>
                                      </div>
                                  </Card>
                              ))}
                    </div>
                )}

                {activeTab === "sent" && (
                    <div className="space-y-4">
                        {sentRequests.length === 0
                            ? renderEmptyState("No sent requests", "Requests you send from search or profiles will appear here.")
                            : sentRequests.map((request) => (
                                  <Card key={request.id} className="p-5" gradient>
                                      <div className="flex flex-col md:flex-row md:items-center gap-5">
                                          <div className="flex-1">{renderPeerSummary(request.peer)}</div>
                                          <div className="flex flex-col sm:flex-row gap-3">
                                              <Link
                                                  href={`/profile/${getPeerId(request.peer)}`}
                                                  className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 px-4 py-2 font-medium text-white hover:bg-white/10"
                                              >
                                                  View Profile
                                              </Link>
                                              <Button
                                                  variant="outline"
                                                  loading={Boolean(actionLoading[request.id])}
                                                  onClick={() => updateRequest(request.id, "cancel")}
                                                  className="border-white/30 text-white hover:bg-white/10"
                                              >
                                                  Cancel Request
                                              </Button>
                                          </div>
                                      </div>
                                  </Card>
                              ))}
                    </div>
                )}

                {activeTab === "network" && (
                    <div className="space-y-4">
                        {connections.length === 0
                            ? renderEmptyState("No connections yet", "Accepted peers will appear in your network.")
                            : connections.map((connection) => (
                                  <Card key={connection.connectionId} className="p-5" gradient>
                                      <div className="flex flex-col md:flex-row md:items-center gap-5">
                                          <div className="flex-1">
                                              {renderPeerSummary(connection.peer)}
                                              {connection.peer?.known_skills?.length ? (
                                                  <p className="text-purple-200 text-sm mt-3">
                                                      {connection.peer.known_skills.slice(0, 4).join(", ")}
                                                  </p>
                                              ) : null}
                                          </div>
                                          <div className="flex flex-col sm:flex-row gap-3">
                                              <Link
                                                  href={`/profile/${getPeerId(connection.peer)}`}
                                                  className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 px-4 py-2 font-medium text-white hover:bg-white/10"
                                              >
                                                  View Profile
                                              </Link>
                                              <Button variant="outline" disabled className="border-white/30 text-white">
                                                  Chat coming soon
                                              </Button>
                                          </div>
                                      </div>
                                  </Card>
                              ))}
                    </div>
                )}
            </div>
        </div>
    );
}
