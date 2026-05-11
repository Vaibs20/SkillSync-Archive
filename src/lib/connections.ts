export type RelationshipStatus =
    | "none"
    | "pending_sent"
    | "pending_received"
    | "connected"
    | "declined"
    | "cancelled";

export function getConnectionPairKey(userA: string, userB: string) {
    return [userA.toString(), userB.toString()].sort().join(":");
}

export function serializeConnection(connection: any, currentUserId: string) {
    const requesterId = connection.requester?._id?.toString() || connection.requester?.toString();
    const recipientId = connection.recipient?._id?.toString() || connection.recipient?.toString();
    const isOutgoing = requesterId === currentUserId;

    return {
        id: connection._id?.toString(),
        status: connection.status,
        direction: isOutgoing ? "outgoing" : "incoming",
        requester: connection.requester,
        recipient: connection.recipient,
        peer: isOutgoing ? connection.recipient : connection.requester,
        requestedAt: connection.requestedAt,
        respondedAt: connection.respondedAt,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
        requesterId,
        recipientId,
    };
}
