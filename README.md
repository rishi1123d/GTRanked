# GT Ranked

A web application for ranking Georgia Tech students and alumni using the ELO rating system.

## Description

GT Ranked allows users to compare and vote on Georgia Tech student and alumni profiles. The application uses the ELO rating system (the same algorithm used in chess rankings) to determine rankings based on community votes. Users can browse top-ranked profiles, vote on profile comparisons, and view the community leaderboard.

## Features

- **Profile Comparison**: Vote on side-by-side profile comparisons to help determine rankings
- **ELO Leaderboard**: View top-ranked GT profiles sorted by ELO rating
- **Search & Filter**: Find specific profiles by name, major, graduation year, and more
- **User Authentication**: Sign in to track your voting history and access personalized features

## Project Structure

The project is organized using a Next.js app router structure:

```
/app
  /auth          # Authentication related pages
    /sign-in     # User sign-in functionality
  /home          # Home page content
  /profiles      # Profile-related features
    /leaderboard # Profile rankings and leaderboard
    /vote        # Profile comparison and voting
  /api           # API routes for backend functionality
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/gt-ranked.git
cd gt-ranked
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Radix UI, shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Data**: Currently using mock data (real API integration planned)
