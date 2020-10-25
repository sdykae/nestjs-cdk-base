// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

import { Handler, Context } from 'aws-lambda';
import { Server } from "http";
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';
// import express from 'express';
import { ExpressAdapter } from "@nestjs/platform-express";
import { NestFactory } from "@nestjs/core";
import { AppModule } from './app.module';
const express = require('express');
// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(3000);
// }
// bootstrap();
let cachedServer: Server;


const binaryMimeTypes: string[] = [];

// const bootstrapServer = async () => {
//   const expressApp = express();
//   const adapter = new ExpressAdapter(expressApp);
//   const app = await NestFactory.create(AppModule, adapter);
//   await app.init();
//   return createServer(expressApp);
// };

async function bootstrapServer(): Promise<Server> {
  if (!cachedServer) {
     const expressApp = express();
     const nestApp = await NestFactory.create(AppModule, new
ExpressAdapter(expressApp))
     nestApp.use(eventContext());
     await nestApp.init();
     cachedServer = createServer(expressApp, undefined,
binaryMimeTypes);
  }
  return cachedServer;
}


// export const api = async (event, context) => {
//   // use cached Nestjs server if exists or create one
//   // when lambdas are hot, they have tendency to cache runtime variables,
//   // so in this case, if we hit one of hot instance, there will be one Nestjs server already bootstrapped
//   if (!cachedServer) {
//     cachedServer = await bootstrapServer();
//   }
//   return proxy(cachedServer, event, context, 'PROMISE').promise;
// };

export const api: Handler = async (event: any, context: Context) => {
  cachedServer = await bootstrapServer();
  return proxy(cachedServer, event, context, 'PROMISE').promise;
}