import { OnboardingTask } from "../onboardingTasks/onboarding.task.model.schema";
import { ModuleVideo } from "../moduleVideos/module.video.model.schema";
import { ModuleResource } from "../moduleResources/module.resource.model.schema";
import { QuizQuestion } from "../quizeQuestions/quiz.question.model.schema";
import { ModuleAction } from "../moduleActions/module.action.model.schema";

/**
 * Automatically drops any legacy unique indexes that include the `order` key
 * across all academy modules. This prevents MongoDB duplicate key (E11000) errors
 * when shifting orders (e.g. prepending new items at order 1 or re-sequencing).
 */
export const dropLegacyOrderIndexes = async (): Promise<void> => {
  const models = [
    { name: "OnboardingTask", model: OnboardingTask },
    { name: "ModuleVideo", model: ModuleVideo },
    { name: "ModuleResource", model: ModuleResource },
    { name: "QuizQuestion", model: QuizQuestion },
    { name: "ModuleAction", model: ModuleAction },
  ];

  for (const { name, model } of models) {
    try {
      const existingIndexes = await model.collection.listIndexes().toArray();
      for (const idx of existingIndexes) {
        if (idx.unique && idx.key && "order" in idx.key) {
          await model.collection.dropIndex(idx.name);
          // eslint-disable-next-line no-console
          console.info(
            `[IndexMigration] Dropped legacy unique index "${idx.name}" on ${model.collection.name} (${name})`,
          );
        }
      }
    } catch {
      // Ignore if collection does not exist or index already dropped
    }
  }
};
