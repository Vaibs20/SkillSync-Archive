⚠️Archived initial version⚠️

# SkillSync

SkillSync is a full-stack, skill-based networking platform designed to connect students, professionals, and learners for collaborative learning and study group formation. By leveraging detailed user profiles and a powerful search feature, SkillSync enables users to find peers based on skills, interests, career goals, and availability. The platform is built with modern web technologies, ensuring a secure, responsive, and user-friendly experience.

## Table of Contents

- Project Overview
- Features
- Tech Stack
- Getting Started
  - Prerequisites
  - Installation
  - Environment Variables
  - Running the Application
- Usage
- Project Structure
- Challenges and Solutions
- Future Scope
- Contributing
- License
- Acknowledgements

## Project Overview

SkillSync addresses the challenge of finding like-minded peers for academic and professional collaboration. Unlike general networking platforms, SkillSync focuses on skill-based matchmaking, allowing users to create detailed profiles and search for others based on specific criteria like skills, department, or career path. The platform is ideal for students seeking study partners, professionals exploring collaborative projects, or learners aiming to share knowledge.

The core feature is a robust search functionality that queries all user profile fields, ensuring precise and flexible matchmaking. Built as a monorepo with Next.js, MongoDB, and Tailwind CSS, SkillSync combines modern design with secure authentication and scalable architecture.

## Features

- **User Authentication**: Secure signup and login using JWT-based authentication with bcrypt password hashing.
- **Onboarding**: Multi-step form to collect user details (e.g., department, skills, career path, availability) for rich profiles.
- **User Profiles**: View and edit personal profiles, including name, bio, skills, and more, with public profile views for other users.
- **Search Feature**: Search users by all profile fields (name, email, branch, graduation year, skills, career path, experience, learning goal, availability, onboarding/verification status) with partial matches and secure results.
- **Protected Routes**: Middleware ensures only authenticated, onboarded users access sensitive pages like search, profiles, and dashboard.
- **Responsive UI**: Modern, mobile-friendly design with Tailwind CSS, featuring a purple gradient theme and glassmorphism effects.
- **Notifications**: User feedback via `react-hot-toast` for actions like login, signup, and search.

## Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: Custom JWT with `jsonwebtoken`, `bcryptjs`
- **HTTP Client**: `axios` for API requests
- **Notifications**: `react-hot-toast`
- **Fonts**: Geist Sans, Geist Mono (via `next/font`)
- **Environment**: Node.js, Vercel (for potential deployment)

## Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **MongoDB**: Local instance or MongoDB Atlas account
- **npm**: v9.x or higher
- **Git**: For cloning the repository

### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/your-username/skillsync.git
   cd skillsync
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

### Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/skillsync?retryWrites=true&w=majority
JWT_SECRET_KEY=your-secret-key
```

- Replace `<username>`, `<password>`, and `your-secret-key` with your MongoDB credentials and a secure JWT key.
- For local MongoDB, use `mongodb://localhost:27017/skillsync`.

### Running the Application

1. **Start the Development Server**:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`.

2. **Build for Production** (optional):

   ```bash
   npm run build
   npm run start
   ```

## Usage

1. **Sign Up**: Navigate to `/signup`, enter your name, email, and password, and create an account.
2. **Onboarding**: Complete the multi-step onboarding form at `/onboarding` to provide details like department, skills, and career path.
3. **Log In**: Use `/login` to access your account.
4. **Search Users**: Go to `/search`, select criteria (e.g., skills: "Python", branch: "Computer Science"), and view results as profile cards.
5. **View Profiles**: Click a search result to view a user’s profile at `/profile/[id]`.
6. **Edit Profile**: Update your profile details at `/profile`.
7. **Logout**: Use the header’s logout button to end your session.

**Example Search**:

- Search for users with skills "Python" and "Java" in the Computer Science department graduating in 2025.
- Results display name, email, department, skills, and career path, linking to full profiles.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication routes (verify, logout)
│   │   ├── users/       # User-related routes (signup, login, search, etc.)
│   │   │   └── search/ # Search API route
│   ├── about/            # Static pages
│   ├── contacts/        # Contact pages
│   ├── dashboard/       # Protected dashboard
│   ├── features/       # Features page
│   ├── login/          # Login page
│   ├── onboarding/    # Onboarding form and components
│   ├── profile/       # User profile pages
│   ├── search/        # Search page
│   ├── signup/        # Signup page
│   ├── study/         # Study page
│   ├── layout.tsx     # Root layout with Header/Footer
│   ├── middleware.ts  # Route protection middleware
│   └── globals.css    # Global styles with Tailwind CSS
├── components/         # Reusable React components
│   ├── Header.tsx     # Navigation header
│   └── Footer.tsx     # Footer with links
├── dbConfig/          # MongoDB connection logic
│   └── dbConfig.ts
├── models/            # Mongoose schemas
│   └── User.ts
├── public/            # Static assets (e.g., logo.png)
└── .env.local         # Environment variables
```

**Key Files**:

- `src/app/api/users/search/route.ts`: Handles search queries with MongoDB.
- `src/app/search/page.tsx`: Renders the search form and results.
- `src/middleware.ts`: Protects routes like `/search` with JWT verification.
- `src/models/User.ts`: Defines the `User` schema with fields like `known_skills`, `career_path`.

## Challenges and Solutions

- **Authentication**: Implementing secure JWT-based auth without NextAuth was complex. Solution: Built custom middleware (`middleware.ts`) to verify tokens and enforce onboarding redirects.
- **Search Flexibility**: Supporting all `User` schema fields required dynamic MongoDB queries. Solution: Used regex for text fields and `$in` for arrays, with pagination for scalability.
- **Responsive UI**: Ensuring the search form was usable on mobile devices. Solution: Applied Tailwind CSS grid layouts and scrollable checkbox lists.
- **MongoDB Connection**: Repeated connection calls slowed API routes. Solution: Centralized connection logic in `dbConfig.ts`.

## Future Scope

- **Matchmaking Model**: Integrate a Python-based matchmaking algorithm to suggest users based on skill and interest compatibility, deployed as a FastAPI/Flask API.
- **Enhanced Search**: Add sorting (e.g., by name, graduation year), quick search bar in the header, and advanced filters.
- **Study Groups**: Implement group creation and management for collaborative learning.
- **Messaging**: Add real-time chat for user communication.
- **Deployment**: Host on Vercel with MongoDB Atlas for production use.
- **Accessibility**: Improve ARIA labels and keyboard navigation for better inclusivity.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/YourFeature`).
3. Commit changes (`git commit -m 'Add YourFeature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request with a detailed description.

Please follow the Code of Conduct and ensure code adheres to TypeScript and Tailwind CSS conventions.

## Acknowledgements

- **Next.js**: For a powerful full-stack framework.
- **Tailwind CSS**: For rapid, responsive styling.
- **MongoDB**: For flexible data storage.
- **Tutorials**: Inspired by Hitesh Choudhary’s Next.js authentication guide and Tailwind CSS documentation.
- **Community**: Thanks to the open-source community for libraries like `react-hot-toast` and `axios`.

---

**Contact**\
For questions or feedback, open an issue on GitHub.

**Live Demo**\
[Click Here](https://skillsync-coral.vercel.app)
