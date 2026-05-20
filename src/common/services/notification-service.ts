import admin from "firebase-admin";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export class NotificationService {
  private client: admin.app.App;

  constructor() {
    const defaultServiceAccountFileName =
      "c45-onlime-app-firebase-adminsdk-fbsvc-be018ccef9.json";

    const explicitServiceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS;

    const candidatePaths = [
      ...(explicitServiceAccountPath ? [explicitServiceAccountPath] : []),
      resolve(process.cwd(), "dist", "config", defaultServiceAccountFileName),
      resolve(process.cwd(), "src", "config", defaultServiceAccountFileName),
    ];

    const serviceAccountPath = candidatePaths.find((p) => !!p && existsSync(p));

    if (!serviceAccountPath) {
      throw new Error(
        `Firebase service account JSON not found. Tried: ${candidatePaths.join(", ")}`,
      );
    }

    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

    this.client = admin.apps.length
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
  }

  async sendNotification({
    token,
    data,
  }: {
    token: string;
    data: { title: string; body: string };
  }) {
    const message = {
      token,
      data,
    };

    return await this.client.messaging().send(message);
  }

  async sendNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: { title: string; body: string };
  }) {
    await Promise.allSettled(
      tokens.map((token) => this.sendNotification({ token, data })),
    );
  }
}

export const notificationService = new NotificationService();
