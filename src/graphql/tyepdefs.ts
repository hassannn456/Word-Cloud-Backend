import fs from "node:fs";
const path = require("path");

const wordCloudFilePath = path.join(__dirname, "/typedefs/wordCloud.graphql");
// const schemaFilePath = new URL("schema.graphql", import.meta.url);

const typeDef = fs.readFileSync(wordCloudFilePath, "utf8");

export const typeDefs = [typeDef]