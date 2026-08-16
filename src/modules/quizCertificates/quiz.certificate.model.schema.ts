import { model, Schema } from "mongoose";

import {
  CERTIFICATE_STATUSES,
  IQuizCertificate,
} from "./quiz.certificate.interface";

const quizCertificateSchema = new Schema<IQuizCertificate>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    module: {
      type: Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true,
    },

    pillar: {
      type: Schema.Types.ObjectId,
      ref: "ChallengePillar",
      required: true,
      index: true,
    },

    quizAttempt: {
      type: Schema.Types.ObjectId,
      ref: "QuizAttempt",
    },

    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    status: {
      type: String,
      enum: CERTIFICATE_STATUSES,
      default: "issued",
      index: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    certificateUrl: {
      type: String,
      trim: true,
    },

    revokedAt: {
      type: Date,
    },

    revokedReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "quizcertificates",
  },
);


quizCertificateSchema.index(
  {
    user: 1,
    module: 1,
  },
  {
    unique: true,
  },
);

quizCertificateSchema.index({
  user: 1,
  pillar: 1,
});

quizCertificateSchema.index({
  status: 1,
  issuedAt: -1,
});

export const QuizCertificate = model<IQuizCertificate>(
  "QuizCertificate",
  quizCertificateSchema,
);
