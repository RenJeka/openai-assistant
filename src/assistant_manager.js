import fs from "fs";
import path from "path";
import chalk from "chalk";
import { formatDate } from "./utils.js";

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
    throw new Error("❌ Не вказано ім'я ассистента (перевірте файл '.env').");
  }
  if (!openAiInstance) {
    throw new Error("❌ Не вказано екземпляр OpenAI.");
  }

  const assistants = await openAiInstance.beta.assistants.list();

  const targetAssistants =
    assistants?.data?.filter((assistant) => assistant.name === assistantName) ||
    [];

  // якщо асистентів немає, створити нового асистента
  if (!assistants?.data?.length || !targetAssistants.length) {
    console.log(
      chalk.yellow(
        `Асистент ${chalk.green.bold(
          assistantName
        )} не знайден. Створення нового асистента...`
      )
    );
    return _createNewAssistant(openAiInstance, assistantName);
  }

  // якщо знайдено більше одного асистента з ім'ям assistantName - вибрати асистента з  останньою датою
  if (targetAssistants.length > 1) {
    targetAssistants.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    const latestAssistant = targetAssistants[0];
    const formattedDate = formatDate(latestAssistant.created_at);

    console.log(
      chalk.yellow(
        `
  ⚠️  Знайдено більше одного асистента з ім'ям: ${chalk.green.bold(
    assistantName
  )}.
  Вибрано фаасистентайл з останньою датою: ${chalk.blue.bold(formattedDate)}.
  ID асистента: ${chalk.grey.bold(latestAssistant.id)}
  `
      )
    );

    return latestAssistant.id;
  }

  // якщо знайдено одного асистента - повернути його id
  console.log(
    `✔️ Асистент ${chalk.green.bold(assistantName)} знайдено: ${chalk.grey.bold(
      targetAssistants[0].id
    )}`
  );
  return targetAssistants[0].id;
}

export async function updateAssistantWithVectorStore(
  openAiInstance,
  assistantId,
  vectorStoreId
) {
  if (!openAiInstance) {
    throw new Error("❌ Не вказано екземпляр OpenAI.");
  }
  if (!assistantId) {
    throw new Error("❌ Не вказано ID асистента.");
  }
  if (!vectorStoreId) {
    throw new Error("❌ Не вказано ID векторного сховища.");
  }

  await openAiInstance.beta.assistants.update(assistantId, {
    tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } },
  });
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
  try {
    const assistant = await openAiInstance.beta.assistants.create({
      name: assistantName,
      instructions: _getAssistantInstructions(),
      model: process.env.OPENAI_MODEL,
      tools: [{ type: "file_search" }],
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE),
    });

    if (!assistant.id) {
      throw new Error(
        chalk.red("❌ Не вдалося створити асистента. Спробуйте ще раз.")
      );
    }

    console.log(
      chalk.green(
        `✔️ Асистент ${chalk.green.bold.underline(assistantName)} створений.`
      )
    );

    return assistant.id;
  } catch (error) {
    throw new Error(chalk.red("❌ Помилка: ") + error.message);
  }
}

/**
 * Retrieves the assistant instructions from a specified file.
 *
 * This function constructs the file path using the environment variable `FOLDER_NAME`
 * and the file name `assistant_instructions.md`. It checks if the file exists, and if not,
 * throws an error indicating that the file was not found. If the file exists, it reads the
 * content of the file and logs it to the console.
 *
 * @throws {Error} Throws an error if the file does not exist.
 * @returns {string} The content of the assistant instructions file.
 */
function _getAssistantInstructions() {
  const ASSISTANT_INSTRUCTIONS_FILE_NAME = "assistant_instructions.md";

  const filePath = path.resolve(
    `${process.env.FOLDER_NAME}/${ASSISTANT_INSTRUCTIONS_FILE_NAME}`
  );
  // Перевіряємо чи файл існує
  if (!fs.existsSync(filePath)) {
    throw new Error(
      chalk.red(
        `❌ Файл ${chalk.red.bold.underline(
          ASSISTANT_INSTRUCTIONS_FILE_NAME
        )} не знайдено. Додайте файл у папку ${chalk.blue.bold.underline(
          process.env.FOLDER_NAME
        )}.`
      )
    );
  }
  const assistantInstructions = fs.readFileSync(filePath, "utf8");
  return assistantInstructions;
}
