# SKP Database Migrations

This directory contains SQL migrations for the SKP Management System database.

## Your Existing Schema

Based on your Supabase database, you already have these tables:
- `users` - User profiles with password stored directly
- `skps` - SKP submissions
- `departments` - Fakultas/Unit Kerja
- `study_programs` - Program Studi

## What These Migrations Add

The migration adds missing tables for:
- `notifications` - System notifications
- `skp_activities` - Activities extracted from approved SKP
- `skp_progress` - Monthly progress reports
- `skp_activity_progress` - Progress per activity
- `skp_progress_evidence` - Evidence/attachment files
- `skp_progress_comments` - Comments on progress
- `skp_progress_history` - Audit trail

## How to Run Migrations

### Step 1: Run the Schema Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Paste and run `001_add_missing_tables.sql`

This will create:
- All missing tables
- Required indexes
- Trigger functions for auto-updating timestamps
- Helper functions for calculating progress percentages

### Step 2: (Optional) Run Seed Data

If you don't have test users yet:
1. Run `002_seed_data.sql` in SQL Editor

This creates test users with these credentials:

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `superadmin` | `superadmin123` |
| Admin | `admin` | `admin123` |
| Dosen | `dosen` | `dosen123` |
| Staff | `staff` | `staff123` |

## Authentication

This system uses **direct database authentication** (no Supabase Auth):
- Users login with username/password
- Password is verified against the `users.password` column
- Session is stored in localStorage/sessionStorage

## RLS (Row Level Security)

RLS is **disabled** by default for easier development. To enable it later:

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- Add your policies here
```

## API Changes

The frontend API has been updated to:
- Use Supabase client for database queries
- Authenticate against the `users` table directly
- Store session in browser storage (not Supabase Auth)

## Troubleshooting

### Login not working
1. Check that the username and password match in the `users` table
2. Ensure `status = true` for the user

### Progress features not working
1. Make sure you ran `001_add_missing_tables.sql`
2. Check that the user has an approved SKP (`status = 'Approved'`)

### "relation does not exist" error
Run the migration files in order:
1. First: `001_add_missing_tables.sql`
2. Then: `002_seed_data.sql` (if needed)
