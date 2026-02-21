# digital-clientele

A Node.js REST API server built with Express and TypeScript.

## Getting Started

### Prerequisites
- Node.js >= 18
- npm

### Installation

```bash
npm install
```

### Development

Start the server with hot reload:

```bash
npm run dev
```

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Production

Run the compiled JavaScript:

```bash
npm start
```

## Project Structure

```
src/
  index.ts          # Entry point
  routes/
    health.ts       # Health check route
dist/               # Compiled output (generated)
```

## API Endpoints

| Method | Path      | Description         |
|--------|-----------|---------------------|
| GET    | /         | Welcome message     |
| GET    | /health   | Health check        |
