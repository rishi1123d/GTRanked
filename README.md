# GTRanked

A platform for comparing and ranking Georgia Tech profiles using the ELO rating system.

## Features

- Compare GT student and alumni profiles side by side
- Vote on which profiles you think are stronger
- View the leaderboard of top-ranked profiles
- Automatic ELO rating updates based on voting

## Technology Stack

- Next.js 14 with TypeScript
- Supabase for database and authentication
- Tailwind CSS for styling
- Radix UI components

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd GTRanked
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Seed the database with mock data:

```bash
npm run seed-db
```

5. Start the development server:

```bash
npm run dev
```

## Database Structure

The application uses a Supabase database with the following tables:

- `profiles`: Stores information about GT students and alumni
- `education`: Education history for each profile
- `work_experience`: Work experience for each profile
- `votes`: Records of votes cast by users

An ELO rating system is implemented via database triggers that automatically update ratings when votes are cast.

## API Routes

- `GET /api/profiles`: Get all profiles with pagination and filtering
- `GET /api/profiles/random`: Get random profiles for voting
- `GET /api/votes`: Get recent votes for a session
- `POST /api/vote`: Cast a vote between two profiles

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
