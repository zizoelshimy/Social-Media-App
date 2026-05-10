# Social-Media-App

A backend API for a social media platform built with TypeScript, Express, MongoDB, and Zod.

## Project Overview

This project provides the core backend foundation for a social media application. It includes:

- Express server bootstrap and routing
- MongoDB connection through Mongoose
- Authentication module (signup and login)
- Request validation middleware using Zod
- Centralized success and error response handling
- Layered architecture with modules, repositories, middleware, and shared utilities

The app currently exposes authentication endpoints and is structured to expand with additional modules such as user and post features.

## Tech Stack

- TypeScript
- Node.js + Express
- MongoDB + Mongoose
- Zod (validation)
- dotenv (environment configuration)

## Firebase Admin (FCM)

This project can send push notifications via Firebase Cloud Messaging.

- Set `FIREBASE_SERVICE_ACCOUNT_PATH` (or `GOOGLE_APPLICATION_CREDENTIALS`) to the path of your Firebase service-account JSON.
- Do not commit service-account JSON files to git.
