# SKP Management System

A React-based Employee Performance Target (SKP) Management System.

## Features
- **Authentication**: Role-based login (Dosen, Kepegawaian, Admin).
- **Dosen**: Submit and track SKP proposals.
- **Kepegawaian**: Approval workflow and evaluation.
- **Admin**: User management and system monitoring.

## Tech Stack
- React 18
- Vite
- Tailwind CSS
- Lucide React

## Configuration

This project uses **Supabase** (or a mock equivalent) for its backend. You need to configure the environment variables.

1.  Open the `.env` file in the `frontend` directory.
2.  Fill in your Supabase credentials:

    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

    > **Note:** Since this project uses Vite, all environment variables accessible in the browser must start with `VITE_`.

## Getting Started
1. `npm install`
2. `npm run dev`
