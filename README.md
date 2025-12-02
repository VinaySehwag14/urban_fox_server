# Express Backend App

A robust and scalable Node.js Express backend application starter with best practices.

## Features

- **Structure**: Organized folder structure for scalability
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan and custom logger
- **Error Handling**: Centralized error handling and async wrapper
- **Code Quality**: ESLint and Prettier configuration
- **Development**: Nodemon for auto-reloading

## Prerequisites

- Node.js (v14+ recommended)
- npm or yarn

## Getting Started

1.  **Clone the repository**

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Environment Setup**

    Copy `.env.example` to `.env` and adjust the values if needed.

    ```bash
    cp .env.example .env
    ```

4.  **Run the application**

    - Development mode:
      ```bash
      npm run dev
      ```

    - Production mode:
      ```bash
      npm start
      ```

## Project Structure

```
src/
├── config/         # Environment variables and configuration
├── controllers/    # Route controllers (request handling logic)
├── middleware/     # Custom express middleware
├── models/         # Data models (e.g., Mongoose schemas)
├── routes/         # Route definitions
├── services/       # Business logic
├── utils/          # Utility functions and helpers
├── app.js          # Express app setup
└── server.js       # Server entry point
```

## API Endpoints

- `GET /health`: Health check endpoint
- `GET /api/v1/health`: API health check

## Scripts

- `npm run dev`: Run server in development mode with nodemon
- `npm start`: Run server in production mode
- `npm run lint`: Run ESLint
- `npm run format`: Run Prettier
