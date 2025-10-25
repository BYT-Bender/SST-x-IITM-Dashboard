# SST x IITM Online Degree Dashboard

## 1. Project Overview

This is a custom student dashboard built to help students at Scaler School of Technology who are also enrolled in the IITM BS in Data Science and Applications online degree program.

The goal is to create a single, clean, and fast interface to centralize all relevant information - deadlines, lectures, courses, and resources - that is often scattered across multiple portals. This project uses a modern **Vanilla JavaScript** frontend and **Supabase** for all backend services (database, authentication), making it lightweight and serverless.

## 2. Current Status

This project is actively in development. Core features are functional, but some sections are still being built out. Contributions and feedback are welcome!

## 3. Features

### Implemented

 - **Google Authentication:** Secure sign-in/sign-up using Google OAuth, managed by Supabase Auth.

 - **Main Dashboard:**
    - Dynamically loads and displays all of the user's currently enrolled courses.
    - Shows a "What's Next?" section with the 3 most urgent upcoming deadlines.

 - **Lectures Page:**

    - **Upcoming:** Shows the next few lectures with a date-based filter.
    - **All Lectures:** A complete, filterable list of all lectures. Users can filter by `Status` (Upcoming/Past), `Subject`, `Date`, and `Mode` (Online/Offline).

 - **Deadlines Page:**

    - A comprehensive list of all deadlines (quizzes, assignments) relevant to the user's courses.
    - Displays status (Upcoming/Overdue) and priority (High/Medium/Low) for each item.

 - **Resources Page:**

    - A central library for documents, links, and other materials.
    - Features client-side filtering by a search bar and clickable tags.

### In Development (Roadmap)

 - **Grades Page:** (Currently `grades.html`) This page is a placeholder and will be built to display course grades and progress.
 - **Attendance Page:** (Currently `attendance.html`) This page is a placeholder and will be built to track lecture attendance.
 - **Mark as Complete:** Adding a checkbox to mark deadlines as completed.
 - **Profile Page:** A page for users to manage their profile and enrolled courses.
 - **Dark Mode:** A toggle for a site-wide dark theme.

## 4. Tech Stack

This project avoids a complex build setup by leveraging vanilla technologies and a powerful backend-as-a-service.

- **Frontend:**

    - **HTML5**
    - **CSS3** (Custom Properties, Flexbox, Grid)
    - **Vanilla JavaScript (ES6+)** (Async/Await, Fetch API)

 - **Backend (Supabase):**

    - **Supabase Auth:** For handling Google OAuth 2.0 and user sessions.
    - **Supabase Database (PostgreSQL):** A relational database to store all application data.

  - **Libraries:**

    - `supabase-js`: The official client library for interacting with Supabase from the frontend.

## 5. Project Structure
```
/
├── auth.html           # Login page
├── index.html          # Main dashboard
├── lectures.html       # Lectures page
├── deadlines.html      # Deadlines page
├── resources.html      # Resources page
├── grades.html         # (WIP)
├── attendance.html     # (WIP)
└── assets/
    ├── scripts/
    │   ├── auth.js         # Handles login logic
    │   ├── index.js        # Powers index.html (courses, upcoming deadlines)
    │   ├── lectures.js     # Powers lectures.html (upcoming & all lectures)
    │   ├── deadlines.js    # Powers deadlines.html (all deadlines)
    │   ├── resourses.js    # Powers resources.html (client-side filtering)
    │   └── dropdown.js     # Reusable dropdown component script
    ├── stylesheets/
    │   ├── style.css       # Main styles for dashboard pages
    │   └── auth.css        # Styles for login page
    └── icons/
        └── ...             # SVG icons
```
