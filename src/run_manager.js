import chalk from "chalk";

/**
 * Runs the assistant on a specific thread.
 *
 * @async
 * @param {OpenAI} openAiInstance - The OpenAI instance to use for thread operations.
 * @param {string} threadId - The ID of the thread to run the assistant on.
 * @param {string} assistantId - The ID of the assistant to run.
 * @returns {Promise<Object>} The run object.
 * @throws Will throw an error if running the assistant fails.
 */
export async function runAssistantOnThread(
  openAiInstance,
  threadId,
  assistantId
) {
  if (!openAiInstance) {
    throw new Error("❌ Не вказано екземпляр OpenAI.");
  }
  if (!threadId) {
    throw new Error("❌ Не вказано ID треду.");
  }
  if (!assistantId) {
    throw new Error("❌ Не вказано ID асистента.");
  }

  const run = await openAiInstance.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });
  console.log(chalk.green(`✔️ Асистент запущено: ${chalk.grey.bold(run.id)}`));
  return run;
}

/**
 * Retrieves the status of a specific run.
 *
 * @async
 * @param {OpenAI} openAiInstance - The OpenAI instance to use for thread operations.
 * @param {string} threadId - The ID of the thread.
 * @param {string} runId - The ID of the run to retrieve the status for.
 * @returns {Promise<Object>} The run status object.
 * @throws Will throw an error if retrieving the run status fails.
 */
export async function getRunStatus(openAiInstance, threadId, runId) {
  if (!openAiInstance) {
    throw new Error("❌ Не вказано екземпляр OpenAI.");
  }
  if (!threadId) {
    throw new Error("❌ Не вказано ID треду.");
  }
  if (!runId) {
    throw new Error("❌ Не вказано ID запуску.");
  }

  const runStatus = await openAiInstance.beta.threads.runs.retrieve(
    threadId,
    runId
  );
  switch (runStatus.status) {
    case "failed":
      throw new Error(chalk.red(`Помилка: ${runStatus.error}`));
    case "in_progress":
      console.error(chalk.cyan("Завантаження..."));
      break;
    default:
      console.log("Статус:", runStatus.status);
  }
  return runStatus;
}
