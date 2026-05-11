import axios from "axios";
import { connect } from "@/dbConfig/dbConfig";
import { AuthError, getCurrentUserId } from "@/lib/apiAuth";
import { SAFE_USER_FIELDS, serializeSafeUser } from "@/lib/users";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const currentUserId = getCurrentUserId(req);
    const { searchParams } = new URL(req.url);

    const getText = (key: string) => searchParams.get(key)?.trim() || "";
    const getList = (key: string) =>
      searchParams
        .getAll(key)
        .map((value) => value.trim())
        .filter(Boolean);

    const criteria = {
      name: getText("name"),
      email: getText("email"),
      branch: getText("branch"),
      passing_year: getText("passing_year"),
      known_skills: getList("known_skills"),
      career_path: getList("career_path"),
      experience: getText("experience"),
      learning_goal: getText("learning_goal"),
      availability: getText("availability"),
      isOnboarded: getText("isOnboarded"),
      isVerified: getText("isVerified"),
    };

    const query = [
      criteria.branch,
      criteria.passing_year,
      ...criteria.known_skills,
      ...criteria.career_path,
      criteria.experience,
      criteria.learning_goal,
      criteria.availability,
      criteria.isOnboarded,
      criteria.isVerified,
    ].filter(Boolean).join(" ");

    // 1️⃣ Fetch users
    await connect();

    const users = await User.find({ _id: { $ne: currentUserId } }).select(SAFE_USER_FIELDS).lean();

    const formattedUsers = users.map((user: any) => serializeSafeUser(user));

    // 2️⃣ Call ML API
    const response = await axios.post("http://localhost:8000/search", {
      query,
      users: formattedUsers,
      criteria,
    });

    const ranked = response.data.results;
    const usersById = new Map(formattedUsers.map((user: any) => [user?._id, user]));

    // 3️⃣ Map results
    const rankedUsers = ranked.map((result: any) => {
      const user = usersById.get(result._id);
      return user ? { ...user, final_score: result.final_score } : null;
    }).filter(Boolean);

    return NextResponse.json(rankedUsers);

  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}








// import axios from "axios";
// import { NextResponse } from "next/server";
// import User from "@/models/User";

// export async function POST(req: Request) {
//   try {
//     const { query } = await req.json();

//     // 1️⃣ Fetch users from MongoDB
//     const users = await User.find({}).lean();

//     // ⚠️ Convert _id to string (VERY IMPORTANT)
//     const formattedUsers = users.map((user: any) => ({
//       ...user,
//       _id: user._id.toString()
//     }));

//     // 2️⃣ Send to ML API
//     const response = await axios.post("http://localhost:8000/search", {
//       query,
//       users: formattedUsers
//     });

//     const ranked = response.data.results;

//     // 3️⃣ Match ranked results with actual users
//    const rankedUsers = ranked.map((r: any) =>
//   formattedUsers.find((u: any) => u._id === r._id)
// ).filter(Boolean);

//     return NextResponse.json(rankedUsers);

//   } catch (error) {
//     console.error("Search error:", error);
//     return NextResponse.json({ error: "Search failed" }, { status: 500 });
//   }
// }



// CODE BEFORE INTREGRATING WITH ML MODEL

// import { connect } from "@/dbConfig/dbConfig";
// import User from "@/models/User";
// import { NextRequest, NextResponse } from "next/server";

// connect();

// export async function GET(req: NextRequest) {
//     try {
//         const { searchParams } = new URL(req.url);
//         const name = searchParams.get("name") || "";
//         const email = searchParams.get("email") || "";
//         const branch = searchParams.get("branch") || "";
//         const passing_year = searchParams.get("passing_year") || "";
//         const known_skills = searchParams.getAll("known_skills");
//         const career_path = searchParams.getAll("career_path");
//         const experience = searchParams.get("experience") || "";
//         const learning_goal = searchParams.get("learning_goal") || "";
//         const availability = searchParams.get("availability") || "";
//         const isOnboarded = searchParams.get("isOnboarded") || "";
//         const isVerified = searchParams.get("isVerified") || "";

//         // Build MongoDB query
//         const query: any = {};
//         if (name) query.name = { $regex: name, $options: "i" };
//         if (email) query.email = { $regex: email, $options: "i" };
//         if (branch) query.branch = branch;
//         if (passing_year) query.passing_year = parseInt(passing_year);
//         if (known_skills.length) query.known_skills = { $in: known_skills };
//         if (career_path.length) query.career_path = { $in: career_path };
//         if (experience) query.experience = experience === "true";
//         if (learning_goal) query.learning_goal = { $regex: learning_goal, $options: "i" };
//         if (availability) query.availability = availability;
//         if (isOnboarded) query.isOnboarded = isOnboarded === "true";
//         if (isVerified) query.isVerified = isVerified === "true";

//         // Fetch users, excluding sensitive fields
//         const users = await User.find(query).select(
//             "-password -forgotPasswordToken -forgotPasswordTokenExpiry -verifyToken -verifyTokenExpiry"
//         );

//         return NextResponse.json({ success: true, users });
//     } catch (error: any) {
//         return NextResponse.json({ error: error.message }, { status: 500 });
//     }
// }
