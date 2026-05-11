export const SAFE_USER_FIELDS =
    "name email branch passing_year known_skills career_path experience learning_goal availability isOnboarded isVerified";

export function serializeSafeUser(user: any) {
    if (!user) {
        return null;
    }

    const source = typeof user.toObject === "function" ? user.toObject() : user;

    return {
        _id: source._id?.toString(),
        id: source._id?.toString(),
        name: source.name,
        email: source.email,
        branch: source.branch || "",
        passing_year: source.passing_year ?? null,
        known_skills: source.known_skills || [],
        career_path: source.career_path || [],
        experience: Boolean(source.experience),
        learning_goal: source.learning_goal || "",
        availability: source.availability || "",
        isOnboarded: Boolean(source.isOnboarded),
        isVerified: Boolean(source.isVerified),
    };
}
