import { ApolloServerErrorCode } from "@apollo/server/errors";
import { GraphQLError } from "graphql";
import { v4 as uuidv4 } from 'uuid';

import AddSentenceModel from "../schema/AddSentence";

export const wordCloudResolvers = {
  Mutation: {
    clear: async (_: any, arg: { check: boolean }) => {
      try {
        const deleteResult = await AddSentenceModel.deleteMany({});

        // Check the result to confirm that documents were deleted
        if (deleteResult.deletedCount !== undefined) {
          return {
            str: `Deleted ${deleteResult.deletedCount} documents from 'add_sentence' collection.`,
          };
        } else {
          throw new Error("Failed to clear the 'add_sentence' collection.");
        }
      } catch (error) {
        throw new GraphQLError("Could not clear collection.", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }
    },
    addText: async (_: any, arg: { text: string }) => {
      try {
        const lines = arg.text.split("\n");

        lines.map(async (line) => {
          if (line.trim().length > 0){
          const newSentence = new AddSentenceModel({ _id: uuidv4(), name: line.trim() });
          await newSentence.save();
          }
        });

        // Count the occurrence of each word
        const wordCountMap: Map<string, number> = new Map();
        lines.forEach((line) => {
          const words = line.split(" ");
          words.forEach((word) => {
            const normalizedWord = word.toUpperCase();
            if (wordCountMap.has(normalizedWord)) {
              wordCountMap.set(
                normalizedWord,
                wordCountMap.get(normalizedWord)! + 1
              );
            } else {
              wordCountMap.set(normalizedWord, 1);
            }
          });
        });

        const entries = Array.from(wordCountMap.entries());
        const wordCloud = entries.map(([text, value]) => ({ text, value }));

        return wordCloud;
      } catch (error) {
        throw new GraphQLError("Could not clear collection.", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }
    },
  },
  Query: {
    health: async (_: any, arg: any) => {
      return { str: "Successfull!" };
    },
    history: async (_: any, arg: any) => {
      try {
        const history = await AddSentenceModel.find({}).sort({ createdAt: 1 });
        return history;
      } catch (error) {
        throw new GraphQLError("Could not clear collection.", {
          extensions: { code: ApolloServerErrorCode.BAD_REQUEST },
        });
      }
    },
  },
};
