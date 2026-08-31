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

    // Pillar-level certificates do not have a module — field is optional and NOT indexed
    module: {
      type: Schema.Types.ObjectId,
      ref: "CourseModule",
      required: false,
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

// One certificate per user per pillar (pillar-level certificates)
quizCertificateSchema.index(
  {
    user: 1,
    pillar: 1,
  },
  {
    unique: true,
  },
);

quizCertificateSchema.index({
  status: 1,
  issuedAt: -1,
});

export const QuizCertificate = model<IQuizCertificate>(
  "QuizCertificate",
  quizCertificateSchema,
);

/**
 * Drop the legacy `user_1_module_1` index that was left over from the old
 * module-level certificate design.  Safe to call multiple times — it is a
 * no-op once the index no longer exists.
 */
export const dropLegacyQuizCertificateIndexes = async (): Promise<void> => {
  try {
    const existingIndexes = await QuizCertificate.collection
      .listIndexes()
      .toArray();

    const legacyIndex = existingIndexes.find(
      (idx) => idx.name === "user_1_module_1",
    );

    if (legacyIndex) {
      await QuizCertificate.collection.dropIndex("user_1_module_1");
      // eslint-disable-next-line no-console
      console.info(
        "[QuizCertificate] Dropped legacy index: user_1_module_1",
      );
    }
  } catch {
    // Ignore — index may already be gone
  }
};
