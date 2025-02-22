import chalk from "chalk";
/**
 * Asynchronously retrieves the thread ID from OpenAI's thread list.
 * If no threads are found, it creates a new thread and returns its ID.
 *
 * @async
 * @param {OpenAI} openAiInstance - The OpenAI instance to use for thread operations.
 * @function getThreadId
 * @returns {Promise<string>} The ID of the existing or newly created thread.
 * @throws Will throw an error if the thread creation or retrieval fails.
 */
export async function getThreadId(openAiInstance) {
  if (!openAiInstance) {
    throw new Error("❌ Не вказано екземпляр OpenAI.");
  }

  // TODO: Add logic to retrieve the thread ID from assistant's metadata

  return _createNewThread(openAiInstance);
}

/**
 * Asynchronously creates a new thread in OpenAI.
 * @async
 * @private
 * @param {OpenAI} openAiInstance - The OpenAI instance to use for thread operations.
 * @returns {Promise<string>} The ID of the newly created thread.
 */
async function _createNewThread(openAiInstance) {
  try {
    const thread = await openAiInstance.beta.threads.create();
    console.log(chalk.green(`✔️ Тред створений.`));
    return thread.id;
  } catch (error) {
    throw new Error(chalk.red("❌ Не вдалося створити тред: ") + error.message);
  }
}

/**
 * Adds a message to an existing thread.
 *
 * @async
 * @param {OpenAI} openAiInstance - The OpenAI instance to use for thread operations.
 * @param {string} threadId - The ID of the thread to add the message to.
 * @param {Object} message - The message object to add to the thread.
 * @param {string} fileId - The ID of the file to attach to the
 * @returns {Promise<void>}
 * @throws Will throw an error if adding the message fails.
 */
export async function addMessageToThread(
  openAiInstance,
  threadId,
  message,
  fileId = null
) {
  if (!openAiInstance) {
    throw new Error("❌ Не вказано екземпляр OpenAI.");
  }
  if (!threadId) {
    throw new Error("❌ Не вказано ID треду.");
  }
  if (!message) {
    throw new Error("❌ Не вказано повідомлення.");
  }

  const messageObject = {
    role: "user",
    content: message,
  };

  if (fileId) {
    messageObject.attachments = [
      { tools: [{ type: "file_search" }], file_id: fileId },
    ];
  }

  try {
    await openAiInstance.beta.threads.messages.create(threadId, messageObject);
    console.log(chalk.green("✔️ Повідомлення додано в тред"));
  } catch (error) {
    throw new Error(
      chalk.red("❌ Не вдалося додати повідомлення в тред: ") + error.message
    );
  }
}

export async function getLastResponse(openAiInstance, threadId) {
  try {
    const messages = await _listThreadMessages(openAiInstance, threadId);
    const assistantResponse = messages.find((msg) => msg.role === "assistant");

    return assistantResponse.content[0].text.value;
  } catch (error) {
    throw new Error(
      chalk.red("❌ Не вдалося отримати відповідь асистента: ") + error.message
    );
  }
}

/**
 * Lists all messages in a specific thread.
 *
 * @async
 * @private
 * @param {OpenAI} openAiInstance - The OpenAI instance to use for thread operations.
 * @param {string} threadId - The ID of the thread to list messages for.
 * @returns {Promise<Array>} The list of messages in the thread.
 * @throws Will throw an error if listing the messages fails.
 */
async function _listThreadMessages(openAiInstance, threadId) {
  if (!openAiInstance) {
    throw new Error("❌ Не вказано екземпляр OpenAI.");
  }
  if (!threadId) {
    throw new Error("❌ Не вказано ID треду.");
  }

  const messages = await openAiInstance.beta.threads.messages.list(threadId);
  console.log(chalk.green("✔️ Повідомлення треду отримано"));
  return messages.data;
}
