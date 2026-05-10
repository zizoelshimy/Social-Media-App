"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
class NotificationService {
    client;
    constructor() {
        const defaultServiceAccountFileName = "c45-onlime-app-firebase-adminsdk-fbsvc-be018ccef9.json";
        const explicitServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
            process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const candidatePaths = [
            ...(explicitServiceAccountPath ? [explicitServiceAccountPath] : []),
            (0, node_path_1.resolve)(process.cwd(), "dist", "config", defaultServiceAccountFileName),
            (0, node_path_1.resolve)(process.cwd(), "src", "config", defaultServiceAccountFileName),
        ];
        const serviceAccountPath = candidatePaths.find((p) => !!p && (0, node_fs_1.existsSync)(p));
        if (!serviceAccountPath) {
            throw new Error(`Firebase service account JSON not found. Tried: ${candidatePaths.join(", ")}`);
        }
        const serviceAccount = JSON.parse((0, node_fs_1.readFileSync)(serviceAccountPath, "utf8"));
        this.client = firebase_admin_1.default.apps.length
            ? firebase_admin_1.default.app()
            : firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(serviceAccount),
            });
    }
    async sendNotification({ token, data }) {
        const message = {
            token,
            data,
        };
        return await this.client.messaging().send(message);
    }
    async sendNotifications({ tokens, data }) {
        const message = {
            tokens,
            data,
        };
        await Promise.allSettled(tokens.map(token => this.sendNotification({ token, data })));
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
