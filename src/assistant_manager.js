import chalk from "chalk";

/**
 * Asynchronously retrieves the assistant ID from OpenAI's assistant list.
 * If no assistants are found, it creates a new assistant and returns its ID.
 *
 * @async
 * @param {OpenAI} openAiInstance - The OpenAI instance to use for assistant operations.
 * @param {string} assistantName - The name of the assistant to create.
 * @function getAssistantId
 * @returns {Promise<string>} The ID of the existing or newly created assistant.
 * @throws Will throw an error if the assistant creation or retrieval fails.
 */
export async function getAssistantId(openAiInstance, assistantName) {
  if (!assistantName) {
    throw new Error("Assistant name is not provided.");
  }
  if (!openAiInstance) {
    throw new Error("OpenAI instance is not provided.");
  }

  const assistants = await openAiInstance.assistants.list();

  const targetAssistants =
    assistants?.data?.filter((assistant) => assistant.name === assistantName) ||
    [];

  // If no assistants are found, create a new assistant
  if (!assistants?.data?.length || !targetAssistants.length) {
    console.log(
      chalk.yellow(
        `Assistant "${chalk.green.bold(
          assistantName
        )}" not found. Creating a new assistant...`
      )
    );
    return _createNewAssistant(openAiInstance, assistantName);
  }

  // If more than one assistant is found with the same name, select the one with the latest creation date
  if (targetAssistants.length > 1) {
    targetAssistants.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    const latestAssistant = targetAssistants[0];
    const formattedDate = formatDate(latestAssistant.created_at);

    console.log(
      chalk.yellow(
        `
⚠️  Multiple assistants found with the name: ${chalk.green.bold(assistantName)}.
Selected the assistant with the latest creation date: ${chalk.blue.bold(
          formattedDate
        )}.
Assistant ID: ${chalk.grey.bold(latestAssistant.id)}
`
      )
    );

    return latestAssistant.id;
  }

  // If one assistant is found, return its ID
  console.log(
    `✔️ Assistant ${chalk.green.bold(assistantName)} found:`,
    targetAssistants[0].id
  );
  return targetAssistants[0].id;
}

/**
 * Asynchronously creates a new assistant in OpenAI.
 * @async
 * @private
 * @param {OpenAI} openAiInstance - The OpenAI instance to use for assistant operations.
 * @param {string} assistantName - The name of the assistant to create.
 * @returns {Promise<string>} The ID of the newly created assistant.
 */
async function _createNewAssistant(openAiInstance, assistantName) {
  const assistant = await openAiInstance.assistants.create({
    name: assistantName,
    purpose: "assistants",
  });

  console.log(
    chalk.green(
      `✔️ Assistant ${chalk.green.bold.underline(assistantName)} created.`
    )
  );
  return assistant.id;
}

/**
 * Format date to string like "31 Jan 2024, 15:30"
 * @param {number} timeStampInSec - timestamp in seconds (python format, OpenAI API format)
 * @returns {string} formatted date
 * @example formatDate(1739641153) // "31 Jan 2024, 15:30"
 */
function formatDate(timeStampInSec) {
  const correctedDate = new Date(timeStampInSec * 1000);
  return `${correctedDate.getDate()} ${correctedDate.toLocaleString("default", {
    month: "short",
  })} ${correctedDate.getFullYear()}, ${correctedDate.getHours()}:${correctedDate.getMinutes()}`;
}
