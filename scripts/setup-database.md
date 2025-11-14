# Database Setup Instructions

## Prerequisites
- Supabase project created and configured
- Environment variables set in `.env` and `.env.local`

## Manual Setup (via Supabase Dashboard)

Since we're not using the Supabase CLI, you'll need to run these SQL scripts manually in the Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following scripts in order:

### Step 1: Create Initial Schema
Copy and paste the contents of `supabase/migrations/001_initial_schema.sql` into the SQL Editor and run it.

### Step 2: Set up Row Level Security
Copy and paste the contents of `supabase/migrations/002_rls_policies.sql` into the SQL Editor and run it.

### Step 3: Insert Sample Data (Optional)
Copy and paste the contents of `supabase/migrations/003_sample_data.sql` into the SQL Editor and run it.

## Verification

After running the scripts, verify the setup by checking:

1. **Tables Created**: Ensure all 8 tables are created:
   - users
   - item_types
   - tool_instances
   - consumable_stock
   - loans
   - consumable_requests
   - audit_logs
   - notifications

2. **Indexes**: Check that performance indexes are created on key columns

3. **RLS Policies**: Verify that Row Level Security is enabled and policies are in place

4. **Sample Data**: If you ran the sample data script, check that test records exist

## Authentication Setup

For the authentication to work properly, you'll also need to:

1. Enable email authentication in Supabase Auth settings
2. Configure the auth providers as needed
3. Set up proper redirect URLs for your application

## Next Steps

Once the database is set up, you can proceed with the application development and API implementation.