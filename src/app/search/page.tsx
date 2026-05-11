"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Link from "next/link";
import formData from "../onboarding/formData";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type RelationshipStatus = "none" | "pending_sent" | "pending_received" | "connected" | "declined" | "cancelled";

interface SearchResult {
    _id: string;
    id?: string;
    name: string;
    email?: string;
    branch?: string;
    passing_year?: number | null;
    known_skills?: string[];
    career_path?: string[];
    final_score?: number;
}

const notifyConnectionsChanged = () => {
    window.dispatchEvent(new Event("connections:changed"));
};

export default function Search() {
    const [searchCriteria, setSearchCriteria] = useState({
        name: "",
        email: "",
        branch: "",
        passing_year: "",
        known_skills: [] as string[],
        career_path: [] as string[],
        experience: "",
        learning_goal: "",
        availability: "",
        isOnboarded: "",
        isVerified: "",
    });

    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [relationshipStatuses, setRelationshipStatuses] = useState<Record<string, RelationshipStatus>>({});
    const [relationshipRequestIds, setRelationshipRequestIds] = useState<Record<string, string>>({});

    const getUserId = (user: SearchResult) => user._id || user.id || "";

    const fetchConnectionStatuses = async (users: SearchResult[]) => {
        const peerIds = users.map(getUserId).filter(Boolean);

        if (peerIds.length === 0) {
            setRelationshipStatuses({});
            setRelationshipRequestIds({});
            return;
        }

        const params = new URLSearchParams({ peerIds: peerIds.join(",") });
        const res = await axios.get(`/api/connections/status?${params.toString()}`);
        setRelationshipStatuses(res.data.statuses || {});
        setRelationshipRequestIds(res.data.requestIds || {});
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            Object.entries(searchCriteria).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((v) => params.append(key, v));
                } else if (value) {
                    params.append(key, value);
                }
            });

            const res = await axios.get(`/api/users/search?${params.toString()}`);
            const data = Array.isArray(res.data) ? res.data : [];

            setResults(data);
            await fetchConnectionStatuses(data);
            toast.success(`Found ${data.length} users!`);
        } catch (error: any) {
            console.error("Search error:", error);
            toast.error(error.response?.data?.error || "Search failed");
            setResults([]);
            setRelationshipStatuses({});
            setRelationshipRequestIds({});
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (key: "known_skills" | "career_path", value: string) => {
        setSearchCriteria((prev) => ({
            ...prev,
            [key]: prev[key].includes(value)
                ? prev[key].filter((v: string) => v !== value)
                : [...prev[key], value],
        }));
    };

    const clearFilters = () => {
        setSearchCriteria({
            name: "",
            email: "",
            branch: "",
            passing_year: "",
            known_skills: [],
            career_path: [],
            experience: "",
            learning_goal: "",
            availability: "",
            isOnboarded: "",
            isVerified: "",
        });
        setResults([]);
        setRelationshipStatuses({});
        setRelationshipRequestIds({});
    };

    const setPeerLoading = (peerId: string, isLoading: boolean) => {
        setActionLoading((prev) => ({ ...prev, [peerId]: isLoading }));
    };

    const sendConnectionRequest = async (peerId: string) => {
        setPeerLoading(peerId, true);
        try {
            await axios.post("/api/connections/requests", { recipientId: peerId });
            setRelationshipStatuses((prev) => ({ ...prev, [peerId]: "pending_sent" }));
            toast.success("Connection request sent");
            notifyConnectionsChanged();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Unable to send request");
            await fetchConnectionStatuses(results);
        } finally {
            setPeerLoading(peerId, false);
        }
    };

    const acceptConnectionRequest = async (peerId: string) => {
        const requestId = relationshipRequestIds[peerId];
        if (!requestId) {
            toast.error("Request details are no longer available");
            await fetchConnectionStatuses(results);
            return;
        }

        setPeerLoading(peerId, true);
        try {
            await axios.patch(`/api/connections/requests/${requestId}`, { action: "accept" });
            setRelationshipStatuses((prev) => ({ ...prev, [peerId]: "connected" }));
            toast.success("Connection accepted");
            notifyConnectionsChanged();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Unable to accept request");
            await fetchConnectionStatuses(results);
        } finally {
            setPeerLoading(peerId, false);
        }
    };

    const renderConnectionButton = (user: SearchResult) => {
        const peerId = getUserId(user);
        const status = relationshipStatuses[peerId] || "none";
        const isLoading = Boolean(actionLoading[peerId]);

        if (status === "connected") {
            return (
                <Button variant="secondary" size="sm" disabled className="w-full">
                    Connected
                </Button>
            );
        }

        if (status === "pending_sent") {
            return (
                <Button variant="outline" size="sm" disabled className="w-full border-white/30 text-white">
                    Pending
                </Button>
            );
        }

        if (status === "pending_received") {
            return (
                <Button
                    variant="primary"
                    size="sm"
                    loading={isLoading}
                    onClick={() => acceptConnectionRequest(peerId)}
                    className="w-full"
                >
                    Accept
                </Button>
            );
        }

        return (
            <Button
                variant="outline"
                size="sm"
                loading={isLoading}
                onClick={() => sendConnectionRequest(peerId)}
                className="w-full border-white/30 text-white hover:bg-white/10"
            >
                Connect
            </Button>
        );
    };

    const departments = formData.find((f) => f.question.includes("department"))?.options || [];
    const years = formData.find((f) => f.question.includes("graduation year"))?.options || [];
    const skills = formData.find((f) => f.question.includes("skills"))?.options || [];
    const careerPaths = formData.find((f) => f.question.includes("career path"))?.options || [];

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Find Your Study Partners</h1>
                    <p className="text-purple-200 text-lg">
                        Search for students with similar interests and goals
                    </p>
                </div>

                <Card className="p-8 mb-8" gradient>
                    <div className="flex justify-between items-center mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-white">Search Filters</h2>
                        <Button variant="ghost" onClick={clearFilters}>
                            Clear All
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Input
                            label="Name"
                            placeholder="Enter name"
                            value={searchCriteria.name}
                            onChange={(e) => setSearchCriteria({ ...searchCriteria, name: e.target.value })}
                        />

                        <Input
                            label="Email"
                            placeholder="Enter email"
                            value={searchCriteria.email}
                            onChange={(e) => setSearchCriteria({ ...searchCriteria, email: e.target.value })}
                        />

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Department</label>
                            <select
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                                value={searchCriteria.branch}
                                onChange={(e) => setSearchCriteria({ ...searchCriteria, branch: e.target.value })}
                            >
                                <option value="">Select department</option>
                                {departments.map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Graduation Year</label>
                            <select
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                                value={searchCriteria.passing_year}
                                onChange={(e) => setSearchCriteria({ ...searchCriteria, passing_year: e.target.value })}
                            >
                                <option value="">Select year</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Skills</label>
                            <div className="max-h-40 overflow-y-auto border p-3 rounded-lg bg-white/80">
                                {skills.map((skill) => (
                                    <label key={skill} className="flex items-center space-x-2 mb-2">
                                        <input
                                            type="checkbox"
                                            checked={searchCriteria.known_skills.includes(skill)}
                                            onChange={() => handleCheckboxChange("known_skills", skill)}
                                        />
                                        <span>{skill}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Career Path</label>
                            <div className="max-h-40 overflow-y-auto border p-3 rounded-lg bg-white/80 mb-4">
                                {careerPaths.map((path) => (
                                    <label key={path} className="flex items-center space-x-2 mb-2">
                                        <input
                                            type="checkbox"
                                            checked={searchCriteria.career_path.includes(path)}
                                            onChange={() => handleCheckboxChange("career_path", path)}
                                        />
                                        <span>{path}</span>
                                    </label>
                                ))}
                            </div>

                            <Input
                                label="Learning Goal"
                                placeholder="Enter learning goal"
                                value={searchCriteria.learning_goal}
                                onChange={(e) => setSearchCriteria({ ...searchCriteria, learning_goal: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button onClick={handleSearch} className="w-full mt-6" loading={loading}>
                        {loading ? "Searching..." : "Search"}
                    </Button>
                </Card>

                {results.length > 0 && (
                    <div>
                        <h2 className="text-2xl text-white mb-4">Search Results ({results.length} found)</h2>
                        <div className="space-y-6">
                            {results.map((user) => {
                                const peerId = getUserId(user);

                                return (
                                    <Card
                                        key={peerId}
                                        className="p-6 hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300"
                                        gradient
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start gap-5">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold">
                                                        {user.name?.charAt(0).toUpperCase() || "U"}
                                                    </div>

                                                    <div>
                                                        <h3 className="text-xl font-semibold text-white">{user.name}</h3>
                                                        <p className="text-purple-200 text-sm">{user.email || "No email"}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 text-sm">
                                                    <p className="text-purple-200">
                                                        <strong className="text-white">Department:</strong>{" "}
                                                        {user.branch || "N/A"}
                                                    </p>
                                                    <p className="text-purple-200">
                                                        <strong className="text-white">Year:</strong>{" "}
                                                        {user.passing_year || "N/A"}
                                                    </p>
                                                    <p className="text-purple-200">
                                                        <strong className="text-white">Skills:</strong>{" "}
                                                        {user.known_skills?.slice(0, 5).join(", ") || "None"}
                                                        {(user.known_skills?.length || 0) > 5 && "..."}
                                                    </p>
                                                    <p className="text-purple-200">
                                                        <strong className="text-white">Career Path:</strong>{" "}
                                                        {user.career_path?.slice(0, 3).join(", ") || "None"}
                                                        {(user.career_path?.length || 0) > 3 && "..."}
                                                    </p>
                                                </div>

                                                {typeof user.final_score === "number" && (
                                                    <div className="mt-4 text-green-300 font-medium">
                                                        Match Score: {user.final_score.toFixed(1)}%
                                                    </div>
                                                )}
                                            </div>

                                            <div className="w-full md:w-44 flex flex-col gap-3 md:pt-2">
                                                {renderConnectionButton(user)}
                                                <Link
                                                    href={`/profile/${peerId}`}
                                                    className="inline-flex items-center justify-center rounded-lg border-2 border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
                                                >
                                                    View Profile
                                                </Link>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {results.length === 0 && !loading && (
                    <Card className="p-12 text-center" gradient>
                        <h3 className="text-2xl font-bold text-white mb-2">No Results Found</h3>
                        <p className="text-purple-200">Try adjusting your filters.</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
