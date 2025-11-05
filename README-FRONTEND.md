# VZ Programming - Frontend (Next.js)

React-based frontend for browsing and discovering nodes in the VZ Programming system.

## Features

- ✅ **Node Registry Browser** - Browse all registered nodes
- ✅ **Search & Filter** - Search by name, description, tags, or filter by category
- ✅ **Node Details** - View detailed information about each node
- ✅ **Statistics Dashboard** - See registry statistics at a glance
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Modern UI** - Built with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Build the backend first (required for API routes)
npm run build

# Start the development server
npm run frontend:dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build for Production

```bash
# Build the Next.js app
npm run frontend:build

# Start production server
npm run frontend:start
```

## Project Structure

```
├── app/
│   ├── api/
│   │   └── nodes/                    # API Route Handlers
│   │       ├── route.ts              # GET all nodes
│   │       ├── [type]/
│   │       │   └── route.ts          # GET specific node
│   │       └── search/
│   │           └── route.ts          # Search nodes
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Home page
├── components/
│   ├── NodeCard.tsx        # Node card component
│   ├── NodeList.tsx        # Node list component
│   ├── NodeFilters.tsx     # Filter component
│   └── NodeStats.tsx       # Statistics component
├── types/
│   └── node.ts             # TypeScript types
└── styles/
    └── globals.css         # Global styles
```

## API Route Handlers (App Router)

The frontend uses Next.js App Router with Route Handlers located in `app/api/`.

### GET /api/nodes

Route Handler: `app/api/nodes/route.ts`

Get all registered nodes with metadata.

**Response:**
```json
{
  "nodes": [...],
  "categories": ["Functional", "Async", ...],
  "stats": {
    "totalNodes": 17,
    "categories": 4,
    "tags": 31,
    "deprecated": 0
  }
}
```

### GET /api/nodes/[type]

Route Handler: `app/api/nodes/[type]/route.ts`

Get a specific node by type.

**Response:**
```json
{
  "node": {
    "type": "async.http-request",
    "displayName": "HTTP Request",
    ...
  }
}
```

### GET /api/nodes/search?q=query&category=Category&tag=tag

Route Handler: `app/api/nodes/search/route.ts`

Search nodes with optional filters.

**Query Parameters:**
- `q` - Search query (searches name, description, type, tags)
- `category` - Filter by category
- `tag` - Filter by tag

## Features

### Node Browser

- Browse all registered nodes in a grid layout
- See node metadata including:
  - Display name and icon
  - Category and version
  - Description
  - Input/output ports
  - Tags
  - Examples
  - Author information

### Search & Filter

- **Search**: Search by name, description, type, or tags
- **Category Filter**: Filter by category (Functional, Async, Utility, etc.)
- **Quick Filters**: One-click category filtering

### Statistics

View registry statistics:
- Total nodes
- Number of categories
- Number of tags
- Deprecated nodes count

## Customization

### Styling

The app uses Tailwind CSS. Customize styles in:
- `tailwind.config.js` - Tailwind configuration
- `styles/globals.css` - Global styles

### Components

All components are in `components/` and can be customized:
- `NodeCard.tsx` - Individual node card
- `NodeList.tsx` - Node list container
- `NodeFilters.tsx` - Search and filter UI
- `NodeStats.tsx` - Statistics display

## Development

### Running in Development Mode

```bash
npm run frontend:dev
```

### Building

```bash
npm run frontend:build
```

### Linting

```bash
npm run frontend:lint
```

## Deployment

### Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

```bash
npm i -g vercel
vercel
```

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Docker

## Troubleshooting

### API Routes Not Working

Make sure the backend is built:
```bash
npm run build
```

The API routes require the compiled backend code in `dist/`.

### Styling Issues

Make sure Tailwind CSS is installed:
```bash
npm install tailwindcss postcss autoprefixer
```

### Type Errors

Make sure TypeScript types are generated:
```bash
npm run build
```

## See Also

- [Main README](../README.md)
- [Node Registry Documentation](../docs/NODE-REGISTRY.md)

