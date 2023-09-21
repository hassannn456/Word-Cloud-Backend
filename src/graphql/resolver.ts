import { wordCloudResolvers } from "./resolvers/wordCloud";

const resolvers = {
  Mutation: {
    ...wordCloudResolvers.Mutation,
  },
  Query: {
    ...wordCloudResolvers.Query,
  }
};

export default resolvers;