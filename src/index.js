import OpenAI from "openai";
import chalk from "chalk";
import { config as dotEnvConfig } from "dotenv";
import { getFileId, getVectorStoreId } from "./file_manager.js";
import {
  getAssistantId,
  updateAssistantWithVectorStore,
} from "./assistant_manager.js";
import {
  getThreadId,
  addMessageToThread,
  getLastResponse,
} from "./thread_manager.js";
import { runAssistantOnThread, getRunStatus } from "./run_manager.js";
import TelegramBot from "node-telegram-bot-api";

dotEnvConfig({ path: ".env" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_KEY, {
  polling: {
    interval: 300,
    autoStart: true,
  },
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const message = msg.text;
  if (message === "/start") {
    bot.sendMessage(chatId, "Привіт! Будь-ласка, введіть запит до асистента:");
  } else {
    bot.sendMessage(chatId, "Ваш запит обробляється ...");
    main(chatId, message);
  }
});

async function main(telegramBotChatID, telegramBotMessage) {
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

    // 3. Завантажуємо файли у асистента. (Отримуємо векторне сховище)
    const vectorStoreId = await getVectorStoreId(openai, [fileId]);

    console.log(`✔️ Id векторного сховища: ${chalk.grey.bold(vectorStoreId)}`);

    await updateAssistantWithVectorStore(openai, assistantId, vectorStoreId);

    // 4. Отримання ID треду
    const threadId = await getThreadId(openai);

    console.log(`✔️ Id треду: ${chalk.grey.bold(threadId)}`);

    // Логіка надсилання повідомлень і отримування відповідей
    // while (true) {
    const message = telegramBotMessage;

    // 5. Додавання повідомлення в тред
    await addMessageToThread(openai, threadId, message);

    //// Якщо ви хочете додати файл до повідомлення, використовуйте цей код
    // await addMessageToThread(openai, threadId, message, fileId);

    // 6. Запуск асистента
    const runObject = await runAssistantOnThread(openai, threadId, assistantId);

    // 7. Очікування відповіді
    while (true) {
      // перевіряємо статус запуску кожні 2 секунди
      await new Promise((resolve) => setTimeout(resolve, 2000));
      runStatus = await getRunStatus(openai, threadId, runObject.id);
      if (runStatus.status === "completed" || runStatus.status === "failed") {
        break;
      }
    }

    // 8. Отримання відповіді
    const lastMessage = await getLastResponse(openai, threadId);
    console.log(`\n💬 Відповідь асистента: \n ${chalk.cyan.bold(lastMessage)}
      `);

    bot.sendMessage(telegramBotChatID, lastMessage);
    // }
  } catch (error) {
    console.error(chalk.red("Помилка: "), error);
  }
  return;
}

/**
 * @example "Які предмети у середу для групи ...?";
 * @returns {Promise<string>} The user message.
 */
async function askUserMessage() {
  return new Promise((resolve, reject) => {
    process.stdout.write(
      chalk.green.bold("\n Введіть повідомлення для асистента: ")
    );
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (data) => {
      resolve(data.trim());
    });
  });
}

// main();
