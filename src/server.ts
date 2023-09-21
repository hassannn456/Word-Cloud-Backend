import "dotenv/config";
import express from "express";
import { expressMiddleware } from "@apollo/server/express4";
import http from "http";
import cors from "cors";
import { json } from "body-parser";
import mongoose from "mongoose";
import "reflect-metadata";

import { createApolloServer } from "./graphql/index";
import { password, username } from "./config";

async function createApp() {
  const app = express();

  const httpServer = http.createServer(app);

  const server = await createApolloServer(httpServer);

  app.use(
    "/",
    cors<cors.CorsRequest>({
      origin: process.env.FRONTEND_ORIGINS,
      credentials: true,
    }),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({}),
    })
  );
  return app;
}

(async () => {
  const app = await createApp();

  try {
    mongoose
      .connect(
        `mongodb+srv://${username}:${password}@cluster0.k53mzlt.mongodb.net/?retryWrites=true&w=majority`
      )
      .then(() => {
        console.log("Connected to MongoDB");
        app.listen({ port: process.env.SERVER_PORT }, () =>
          console.log(
            `🚀 Server ready at http://localhost:${process.env.SERVER_PORT}/`
          )
        );
      })
      .catch(() => {
        console.error("Error connecting to MongoDB");
      });
    // Continue with your existing setup
  } catch (error) {
    // Handle connection errors
    console.error("Error creating the app:", error);
  }
})();
