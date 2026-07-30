import express from "express";
import type { Request, Response, NextFunction } from "express";
import { authRouter, notificationRouter, postRouter, storyRouter, userRouter } from "./modules";
import { globalErrorHandler } from "./middleware";
import { PORT } from "./config/config";
import connectDB from "./DB/connection.db";
import redisService from "./common/services/redis.service";
import cors from "cors";
import { realtimeService, s3Service } from "./common/services";
import("./DB/repository/base.repository.js");
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { successResponse } from "./common/response";
import { GraphQLBoolean, GraphQLFloat, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql'
import { createHandler } from "graphql-http/lib/use/express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { postService } from "./modules/post/post.service";
import { commentService } from "./modules/comment/comment.service";
import { storyService } from "./modules/story/story.service";
import { notificationService as notificationCrudService } from "./modules/notification/notification.service";
const s3WriteStream = promisify(pipeline);
const bootstrap = async (): Promise<void> => {
  const app: express.Express = express();
  const io = new Server();
  realtimeService.initialize(io);

  const postType = new GraphQLObjectType({
    name: "Post",
    fields: {
      id: { type: new GraphQLNonNull(GraphQLString), resolve: (value) => value._id?.toString?.() || value.id },
      content: { type: GraphQLString },
      folderId: { type: GraphQLString },
      availability: { type: GraphQLInt },
      createdAt: { type: GraphQLString },
      deletedAt: { type: GraphQLString },
    },
  });
  const commentType = new GraphQLObjectType({
    name: "Comment",
    fields: {
      id: { type: new GraphQLNonNull(GraphQLString), resolve: (value) => value._id?.toString?.() || value.id },
      content: { type: GraphQLString },
      postId: { type: GraphQLString },
      createdAt: { type: GraphQLString },
    },
  });
  const storyType = new GraphQLObjectType({
    name: "Story",
    fields: {
      id: { type: new GraphQLNonNull(GraphQLString), resolve: (value) => value._id?.toString?.() || value.id },
      content: { type: GraphQLString },
      expiresAt: { type: GraphQLString },
    },
  });
  const notificationType = new GraphQLObjectType({
    name: "Notification",
    fields: {
      id: { type: new GraphQLNonNull(GraphQLString), resolve: (value) => value._id?.toString?.() || value.id },
      title: { type: GraphQLString },
      body: { type: GraphQLString },
      audience: { type: GraphQLString },
      sentAt: { type: GraphQLString },
    },
  });
  const userType = new GraphQLObjectType({
    name: "User",
    fields: {
      id: { type: new GraphQLNonNull(GraphQLString), resolve: (value) => value._id?.toString?.() || value.id },
      firstName: { type: GraphQLString },
      lastName: { type: GraphQLString },
      email: { type: GraphQLString },
      slug: { type: GraphQLString },
      role: { type: GraphQLInt },
    },
  });
  const postPageType = new GraphQLObjectType({
    name: "PostPage",
    fields: {
      docs: { type: new GraphQLNonNull(new GraphQLList(postType)) },
      currentPage: { type: GraphQLInt },
      size: { type: GraphQLInt },
      pages: { type: GraphQLFloat },
    },
  });
  const queryType = new GraphQLObjectType({
    name: "Query",
    fields: {
      sayHello: { type: GraphQLString, resolve: () => "Hello from Social Media App" },
      me: { type: userType, resolve: (_, __, context) => context.user ?? null },
      feed: {
        type: postPageType,
        args: { page: { type: GraphQLInt }, size: { type: GraphQLInt }, search: { type: GraphQLString } },
        resolve: (_, args, context) => postService.postList(args, context.user),
      },
      stories: {
        type: new GraphQLList(storyType),
        resolve: (_, __, context) => storyService.storyList(context.user),
      },
      notifications: {
        type: new GraphQLList(notificationType),
        resolve: (_, __, context) => notificationCrudService.listNotifications(context.user),
      },
      commentsByPost: {
        type: new GraphQLList(commentType),
        args: { postId: { type: new GraphQLNonNull(GraphQLString) } },
        resolve: (_, args, context) => commentService.commentList(args.postId, context.user),
      },
    },
  });
  const storyInput = new GraphQLInputObjectType({
    name: "StoryInput",
    fields: {
      content: { type: GraphQLString },
    },
  });
  const notificationInput = new GraphQLInputObjectType({
    name: "NotificationInput",
    fields: {
      title: { type: new GraphQLNonNull(GraphQLString) },
      body: { type: new GraphQLNonNull(GraphQLString) },
      audience: { type: new GraphQLNonNull(GraphQLString) },
    },
  });
  const mutationType = new GraphQLObjectType({
    name: "Mutation",
    fields: {
      createStory: {
        type: storyType,
        args: { input: { type: new GraphQLNonNull(storyInput) } },
        resolve: (_, { input }, context) => storyService.createStory(input, context.user),
      },
      deleteStory: {
        type: GraphQLBoolean,
        args: { storyId: { type: new GraphQLNonNull(GraphQLString) } },
        resolve: (_, { storyId }, context) => storyService.deleteStory(storyId, context.user),
      },
      createNotification: {
        type: notificationType,
        args: { input: { type: new GraphQLNonNull(notificationInput) } },
        resolve: (_, { input }, context) => notificationCrudService.createNotification(input, context.user),
      },
    },
  });
  const schema = new GraphQLSchema({ query: queryType, mutation: mutationType });
  app.all("/graphql", createHandler({ schema, context: (req) => ({ user: (req as any).raw?.user ?? (req as any).user }) }));
  app.use(express.json(), cors());
  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ message: "Welcome to Social Media App" });
  });

  /*    app.post("/send-notification",async (req:Request,res:Response,next:NextFunction):Promise<express.Response>=>{
      console.log({token:req.body.token}) 
      await notificationService.sendNotification({
        token:req.body.token,
        data:{
          title:"Hello from Social Media App",
          body:"This is a test notification"
        } 
      })
      return res.status(200).json({message:"Welcome to Social Media App"})
    }) */
  //applying routing
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/post", postRouter);
  app.use("/story", storyRouter);
  app.use("/notification", notificationRouter);

  app.get(
    "/uploads/*path",
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      const { download, fileName } = req.query as {
        download: string;
        fileName: string;
      };
      const { path } = req.params as { path: string[] };
      const Key = path.join("/");
      const { Body, ContentType } = await s3Service.getAssets({ Key });
      console.log({ Body, ContentType });
      res.setHeader("Content-Type", ContentType || "application/octet-stream");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      if (download === "true") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName || Key.split("/").pop()}"`,
        ); // only app
      }

      return await s3WriteStream(Body as NodeJS.ReadableStream, res);
    },
  );
  app.get(
    "/pre-signed/*path",
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      const { download, fileName } = req.query as {
        download: string;
        fileName: string;
      };
      const { path } = req.params as { path: string[] };
      const Key = path.join("/");
      const url = await s3Service.createPresignedFethcLink({
        Key,
        download,
        fileName,
      });
      return successResponse({ res, data: { url } });
    },
  );

  app.get(
    "/*dummy",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      res.status(404).json({ message: "invalid routing" });
    },
  );
  //connecting the database
  await connectDB();
  await redisService.connect();

  //application-error
  app.use(globalErrorHandler);
  const server = createServer(app);
  io.attach(server, { cors: { origin: true, credentials: true } });
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  console.log("Application bootstrapped successfully ");
};
export default bootstrap;
