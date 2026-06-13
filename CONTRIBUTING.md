# Contributing to Truss

Thanks for your interest in contributing. This document covers how to get the project running locally and how to submit changes.

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js 20+](https://nodejs.org/) (for frontend-only work)
- [Python 3.11+](https://www.python.org/) (for backend-only work)

### Run the full stack

```bash
git clone https://github.com/PracticalMind/truss.git
cd truss
docker compose up --build
```

- Frontend → http://localhost:5173
- Backend API → http://localhost:8000

No external services required. Everything runs locally with `AUTH_PROVIDER=local` and `STORAGE_PROVIDER=local`.

### Run services individually

**Backend**

```bash
cd backend
cp .env.example .env        # edit DATABASE_URL if needed
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux
pip install -e .
uvicorn app.main:app --reload
```

**Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Project Structure

```
truss/
├── backend/          # FastAPI application
│   └── app/
│       ├── api/      # Route handlers
│       ├── core/     # Auth, config, storage providers
│       └── services/ # DB, ML pipeline, models
├── frontend/         # React + Vite application
│   └── src/
│       ├── pages/    # Page components
│       ├── contexts/ # Auth context
│       └── services/ # API client
└── docker-compose.yml
```

## Making Changes

1. Fork the repository and create a branch from `main`
2. Make your changes
3. Test with `docker compose up --build` or the individual dev servers
4. Open a pull request against `main`

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Describe what the change does and why in the PR description
- If you're fixing a bug, include steps to reproduce it

## Reporting Issues

Use [GitHub Issues](https://github.com/PracticalMind/truss/issues). Include:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your OS and relevant versions (Docker, Node, Python)

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).