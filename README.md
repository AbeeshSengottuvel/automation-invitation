# Automation Arena

A private invitation-and-competition website for a friendly test automation contest between QA engineers.

## Features
- **Zero Registration**: Guests are invited via personalized URL parameters.
- **Privacy First**: No cookies, no trackers, no forms, no backend database.
- **Apple-inspired Design**: Clean typography, glassmorphism, fluid motion, dark mode.
- **Automated Scoring**: GitHub Actions runs player tests in isolated containers and updates a live leaderboard every 30 minutes.

## Setup Instructions

### 1. Repository Setup
1. Fork or clone this repository.
2. Ensure GitHub Pages is enabled: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
3. Enable Actions: **Settings > Actions > General > Workflow permissions > Read and write permissions**.

### 2. Branding and Dates
Edit `script.js` to change the `startDate` in the `CONFIG` object.
Edit `index.html` to change the event details and text.

### 3. Generating Invitations
1. Open `invite.html` locally in your browser (e.g. double-click the file).
2. Type a list of names.
3. Click "Generate Links" and copy them.
4. Send the links to your friends via your group chat.

### 4. Adding Players
When a player finishes their framework and sends you their repo link:
1. Edit `data/players.json`.
2. Add a new object with their `username`, `displayName`, `repo`, `tool`, and `language`.
3. Commit and push. The `score.yml` action will trigger automatically, run their tests, and update `data/results.json`.

## Local Development
Since there is no build step, you can use any simple HTTP server to test locally:

```bash
npx serve .
# or
python3 -m http.server
```

## Security Note
The `.github/workflows/score.yml` file uses a matrix strategy to run untrusted player code. 
- Job 2 (`run-players`) has **read-only** permissions.
- Job 3 (`aggregate`) has **write** permissions but does not check out or execute player code.
- Scheduled runs are disabled automatically by GitHub after 60 days of inactivity.

## License
MIT
