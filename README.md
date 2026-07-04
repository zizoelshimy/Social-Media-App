# Social-Media-App

A scalable backend API for a social media platform built with **TypeScript**, **Node.js**, **Express**, **MongoDB**, **Mongoose**, **Zod**, **GraphQL**, **Socket.IO**, **Firebase Cloud Messaging**, and **AWS S3** as a storage layer.

## Project Overview

Social-Media-App is a backend-focused project that provides the core foundation for a modern social media application.  
The project is designed with a clean, modular, and extendable architecture to support authentication, real-time communication, media storage, validation, and future expansion into users, posts, comments, reactions, and notifications.

The backend currently includes authentication endpoints and a well-structured codebase that can be extended with additional social features.

## Key Features

- Express server bootstrap and modular routing
- MongoDB connection using Mongoose
- Authentication module with signup and login flows
- Request validation middleware using Zod
- Centralized success and error response handling
- Layered architecture with modules, repositories, middleware, shared utilities, and reusable services
- GraphQL support for flexible client-driven data querying
- Socket.IO integration for real-time features such as live events, notifications, and online presence
- Firebase Cloud Messaging support for push notifications
- AWS S3 integration as a storage layer for media and uploaded files
- Environment-based configuration using dotenv
- Secure handling of service-account credentials and environment secrets

## Tech Stack

### Backend
- TypeScript
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Validation
- Zod

### Real-Time Communication
- Socket.IO

### API Layer
- REST APIs
- GraphQL

### Notifications
- Firebase Admin SDK
- Firebase Cloud Messaging (FCM)

### Storage
- AWS S3

### Configuration
- dotenv

## Architecture

The project follows a layered and modular backend architecture:

```text
src/
├── config/
├── modules/
│   └── auth/
├── repositories/
├── middleware/
├── shared/
├── utils/
├── app.ts
└── server.ts
```

### Architecture Goals

- Keep business logic separated from routing logic
- Make modules reusable and easy to extend
- Centralize error handling and API responses
- Keep validation consistent across endpoints
- Support future scaling into more social media modules
- Keep storage, notification, and real-time services isolated from core modules

## Current Modules

### Authentication Module

The authentication module currently supports:

- User signup
- User login
- Request validation using Zod schemas
- Centralized response handling
- Structured error handling

## Planned Expansion

The project structure is prepared to support additional modules such as:

- User profiles
- Posts
- Comments
- Likes and reactions
- Follow system
- Real-time chat
- Push notifications
- Media uploads
- Feed generation
- Admin moderation tools

## Firebase Admin and FCM

This project can send push notifications using Firebase Cloud Messaging.

### Environment Setup

Set one of the following environment variables:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=path/to/firebase-service-account.json
```

or:

```env
GOOGLE_APPLICATION_CREDENTIALS=path/to/firebase-service-account.json
```

> Do not commit Firebase service-account JSON files to Git.

## AWS S3 Storage

AWS S3 is used as a storage layer for handling uploaded media and files.

Example environment variables:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET_NAME=your_bucket_name
```

> Do not commit AWS credentials to Git.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/zizoelshimy/Social-Media-App.git
cd Social-Media-App
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

Create a `.env` file in the root directory and add the required environment variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_SERVICE_ACCOUNT_PATH=path/to/firebase-service-account.json
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET_NAME=your_bucket_name
```

### 4. Run the project in development mode

```bash
npm run dev
```

## API Scope

The project currently exposes authentication-related endpoints and is structured to expand with more APIs.

Example planned API groups:

```text
/api/auth
/api/users
/api/posts
/api/comments
/api/notifications
```

## Security Notes

- Keep all secrets inside `.env`
- Do not commit Firebase service-account files
- Do not commit AWS credentials
- Validate incoming requests before reaching business logic
- Keep authentication and authorization logic centralized
- Use secure token handling for protected routes

## Repository

GitHub: https://github.com/zizoelshimy/Social-Media-App

## Author

**Moataz Mohamed El-shimy**  
Full Stack Developer
