import mongoose, { Schema, InferSchemaType } from "mongoose";

const humanityVerificationSchema = new Schema(
  {
    wallet: {
      type: String,
      required: true,
      index: true,
      unique: true,
      trim: true,
    },

    verificationCount: {
      type: Number,
      default: 0,
    },

    latestChallengeId: String,
    latestPassed: Boolean,
    latestConfidenceLevel: String,

    latestAverageHumanityScore: Number,
    latestAdjustedHumanityScore: Number,
    latestAverageAccuracy: Number,

    latestGamesPassed: Number,
    latestTotalGames: Number,

    latestVarianceAnalytics: {
      type: Schema.Types.Mixed,
      default: null,
    },

    latestBotRiskSignals: {
      type: Schema.Types.Mixed,
      default: null,
    },

    latestAttestation: {
      type: Schema.Types.Mixed,
      default: null,
    },

    latestZkProof: {
      type: Schema.Types.Mixed,
      default: null,
    },

    latestResult: {
      type: Schema.Types.Mixed,
      default: null,
    },

    lastVerifiedAt: Date,
  },
  { timestamps: true }
);

export type HumanityVerificationDoc = InferSchemaType<
  typeof humanityVerificationSchema
>;

export const HumanityVerification =
  mongoose.models.HumanityVerification ||
  mongoose.model("HumanityVerification", humanityVerificationSchema);
