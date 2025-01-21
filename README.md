# SanMar Integration with Printavo

A full-stack application that integrates SanMar's SOAP API with Printavo for automated order processing.

## Project Structure

```
sanmar-integration/
├── backend/           # Node.js/Express backend
├── client/           # React/Vite frontend
├── docs/             # Project documentation
└── package.json      # Workspace manager
```

## Quick Start

1. Install dependencies for all workspaces:
```bash
npm run install:all
```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in both `backend/` and `client/` directories
   - Fill in the required environment variables in each `.env` file

3. Start development servers:
```bash
npm run dev
```
This will start both the backend (port 3000) and frontend (port 5173) in development mode.

Or for production:
```bash
npm start
```

## Development

- Backend development: `npm run dev:backend`
- Frontend development: `npm run dev:frontend`

## Documentation

- Backend API documentation is available in the `docs/` directory
- Frontend component documentation is available in Storybook (run `npm run storybook` in the client directory)

## Testing

Run tests for both frontend and backend:
```bash
npm test
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

ISC 