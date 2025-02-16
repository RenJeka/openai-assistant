import OpenAI from "openai";
import chalk from "chalk";
import { config as dotEnvConfig } from "dotenv";
import { getFileId } from "./file_manager.js";
import { getAssistantId } from "./assistant_manager.js";

dotEnvConfig({ path: ".env" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  try {
    const fileId = await getFileId(openai, process.env.FILE_NAME);

    console.log(`✔️ Id файлу: ${chalk.grey.bold(fileId)}`);

    const assistantId = await getAssistantId(
      openai,
      process.env.ASSISTANT_NAME
    );

    // // // 2. Створення асистента
    // const assistant = await openai.beta.assistants.create({
    //   name: "Schedule Assistant",
    //   instructions:
    //     "You are a schedule assistant. Answer questions about the schedule provided.",
    //   model: "gpt-4o-mini-2024-07-18",
    //   tools: [{ type: "file_search" }],
    //   temperature: 0.2,
    // });

    // // console.log("Асистент створений:", assistant.id);

    // const assistantId = "asst_ApF7iaYDJlZAbcQfqLY8SdN7";

    // // 3. Створення треду
    // const thread = await openai.beta.threads.create();

    // console.log("Тред створений:", thread.id);

    // // 4. Додавання повідомлення в тред
    // await openai.beta.threads.messages.create(thread.id, {
    //   role: "user",
    //   content:
    //     "Can you tell me when the 'Математичний аналіз' exam is scheduled?",
    //   attachments: [{ tools: [{ type: "file_search" }], file_id: file.id }],
    // });

    // console.log("Запит додано в тред");

    // // 5. Запуск асистента
    // const run = await openai.beta.threads.runs.create(thread.id, {
    //   assistant_id: assistantId,
    // });

    // console.log("Асистент запущено:", run.id);

    // // 6. Очікування відповіді
    // let runStatus;
    // do {
    //   await new Promise((resolve) => setTimeout(resolve, 2000)); // Очікування 2 секунди
    //   runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    //   if (runStatus.status === "failed") {
    //     throw new Error(`Помилка: ${runStatus.error}`);
    //   }
    //   if (runStatus.status === "in_progress") {
    //     console.error("Завантаження...");
    //   }
    //   console.log("Статус:", runStatus.status);
    // } while (runStatus.status !== "completed" || runStatus.status !== "failed");

    // // 7. Отримання відповіді
    // const messages = await openai.beta.threads.messages.list(thread.id);
    // const assistantResponse = messages.data.find(
    //   (msg) => msg.role === "assistant"
    // );

    // console.log("Відповідь асистента:", assistantResponse?.content.text.value);
  } catch (error) {
    console.error(chalk.red("Помилка: "), error);
  }
}

/**
 * Outputs the result of the assistant's response.
 *
 */
async function outputResult(run) {
  if (run.status === "completed") {
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    for (const message of messages.data.reverse()) {
      console.log(`${message.role}: ${message.content[0].text.value}`);
    }
  } else {
    console.log(run.status);
  }
}

main();
