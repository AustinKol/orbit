# Orbit

> 🏆 **Winner of MLH Best Use of Gemini at McHacks 13** · [View on Devpost](https://devpost.com/software/orbit-b1t3np)

Orbit is an interactive 3D map of how public companies are connected. It renders 500+ companies and the relationships between them (supply chains, ownership stakes, partnerships, debt, licensing, board interlocks and more) as an explorable galaxy, then uses Google Gemini to explain what those connections mean and how news can ripple through the market.

## Features

- **3D relationship graph:** Fly through a force-directed galaxy of companies. Click a company to focus it, see its connections, and view its market data.
- **Relationship filters:** Toggle 10 color-coded relationship types: Ownership, Partnership, Client, Supplier, Creditor, Debtor, Joint Venture, Licensing, Swaps and Board Interlock.
- **Path Finder:** Find and score the chains of relationships that link any two companies.
- **Cycle Detection:** Find circular dependencies that start and end at a company (for example, 3M → Boeing → … → 3M), with a configurable hop depth.
- **Orbit AI (Gemini):** Ask finance questions in plain English, control the graph with commands like *"Show me Apple"* or *"Find path between Tesla and NVIDIA"*, or paste a news story to see which companies it affects.
- **Market Pulse and News:** Gemini-summarized news for companies and an impact analysis of the affected parts of the graph.
- **Watchlist:** Pin the companies you care about and highlight them in the graph.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- [react-force-graph-3d](https://github.com/vasturiano/react-force-graph) / [three.js](https://threejs.org) for the 3D visualization
- [Google Gemini](https://ai.google.dev) via `@google/generative-ai`
- Tailwind CSS 4, Framer Motion, Recharts, Lucide icons

## Getting started

**Prerequisites:** Node.js 20+ and a [Gemini API key](https://aistudio.google.com/app/apikey).

```bash
git clone https://github.com/AustinKol/orbit.git
cd orbit
npm install
```

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_api_key_here
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The graph works without an API key. Only the AI and news features need one.

| Script          | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the development server |
| `npm run build` | Build for production         |
| `npm run start` | Serve the production build   |
| `npm run lint`  | Run ESLint                   |

## API routes

| Route                | Method | Description                                                 |
| -------------------- | ------ | ----------------------------------------------------------- |
| `/api/graph`         | GET    | Full company graph (nodes and edges)                        |
| `/api/search?q=`     | GET    | Search companies by name                                    |
| `/api/paths`         | GET    | Paths between two companies (`from`, `to`, `depth`)         |
| `/api/cycles`        | GET    | Cycles through a company (`node`, `maxDepth`, `maxCycles`)  |
| `/api/ai/analyze`    | POST   | Gemini analysis: relationships, news impact or finance Q&A  |
| `/api/ai/action`     | POST   | Turn a natural-language command into a graph action         |
| `/api/news`          | POST   | Gemini-summarized recent news for companies                 |

The AI and news routes are rate-limited to 10 requests per IP per hour.

## Project structure

```
src/
  app/          # Next.js pages and API routes
  components/   # GraphViz (3D graph), Chatbot, PathFinder, ToolsNavbar, panels
  services/     # Graph, path-finding/scoring and Gemini AI services
  data/         # Company and relationship dataset (graph.json, companies.json)
  lib/          # Rate limiting
scripts/        # Python scripts used to generate the dataset
```

## Disclaimer

Orbit was built in a weekend at a hackathon. The company relationship dataset is generated for demo purposes and is not financial advice.

## License

[MIT](LICENSE)
