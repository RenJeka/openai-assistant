import OpenAI from "openai";
import chalk from "chalk";
import { config as dotEnvConfig } from "dotenv";
import { getFileId } from "./file_manager.js";
import { getAssistantId } from "./assistant_manager.js";
import {
  getThreadId,
  addMessageToThread,
  getLastResponse,
} from "./thread_manager.js";
import { runAssistantOnThread, getRunStatus } from "./run_manager.js";

dotEnvConfig({ path: ".env" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  let runStatus;

  try {
    // 1. Отримання ID файлу
    const fileId = await getFileId(openai, process.env.FILE_NAME);

    console.log(`✔️ Id файлу: ${chalk.grey.bold(fileId)}`);

    // 2. Отримання ID асистента
    const assistantId = await getAssistantId(
      openai,
      process.env.ASSISTANT_NAME
    );

    console.log(`✔️ Id асистента: ${chalk.grey.bold(assistantId)}`);

    // 3. Отримання ID треду
    const threadId = await getThreadId(openai);

    console.log(`✔️ Id треду: ${chalk.grey.bold(threadId)}`);

    // TODO: create a message dynamically via console input
    const message = "Які пари по розкладу на вівторок: ?";

    // 4. Додавання повідомлення в тред
    await addMessageToThread(openai, threadId, message, fileId);

    // 5. Запуск асистента
    const runObject = await runAssistantOnThread(openai, threadId, assistantId);

    // 6. Очікування відповіді
    while (true) {
      // перевіряємо статус запуску кожні 2 секунди
      await new Promise((resolve) => setTimeout(resolve, 2000));
      runStatus = await getRunStatus(openai, threadId, runObject.id);
      if (runStatus.status === "completed" || runStatus.status === "failed") {
        break;
      }
    }

    // 7. Отримання відповіді
    const lastMessage = await getLastResponse(openai, threadId);
    console.log(`✔️ Відповідь асистента: ${chalk.cyan.bold(lastMessage)}`);
  } catch (error) {
    console.error(chalk.red("Помилка: "), error);
  }
}

main();
