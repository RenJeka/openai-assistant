import fs from "fs";
import path from "path";
import chalk from "chalk";
import { formatDate } from "./utils.js";

/**
 * Asynchronously retrieves the file ID from OpenAI's file list.
 * If no files are found, it uploads a new file and returns its ID.
 *
 * @async
 * @param {OpenAI} openAiInstance - The OpenAI instance to use for file operations.
 * @param {string} fileName - The name of the file to upload.
 * @function getFileId
 * @returns {Promise<string>} The ID of the existing or newly created file.
 * @throws Will throw an error if the file upload or retrieval fails.
 */
export async function getFileId(openAiInstance, fileName) {
  if (!fileName) {
    throw new Error("❌ Не вказано ім'я файлу.");
  }
  if (!openAiInstance) {
    throw new Error("❌ Не вказано екземпляр OpenAI.");
  }

  const files = await openAiInstance.files.list();

  const targetFiles =
    files?.data?.filter((file) => file.filename === fileName) || [];

  // якщо файлів немає, створити новий файл
  if (!files?.data?.length || !targetFiles.length) {
    console.log(
      chalk.yellow(
        `Файл "${chalk.green.bold(
          fileName
        )}" не знайдено. Створення нового файлу...`
      )
    );
    return _createNewFile(openAiInstance, fileName);
  }

  // якщо знайдено більше одного файлу з ім'ям fileName - вибрати файл з останньою датою
  if (targetFiles.length > 1) {
    targetFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestFile = targetFiles[0];
    const formattedDate = formatDate(latestFile.created_at);

    console.log(
      chalk.yellow(
        `
⚠️  Знайдено більше одного файлу з ім'ям: ${chalk.green.bold(fileName)}.
Вибрано файл з останньою датою: ${chalk.blue.bold(formattedDate)}.
Id файлу: ${chalk.grey.bold(latestFile.id)}
`
      )
    );

    return latestFile.id;
  }

  // якщо знайдено один файл - повернути його id
  console.log(
    `✔️ Файл ${chalk.green.bold(fileName)} знайдено:`,
    targetFiles[0].id
  );
  return targetFiles[0].id;
}

/**
 * Asynchronously uploads a new file to OpenAI.
 * @async
 * @private
 * @param {OpenAI} openAiInstance - The OpenAI instance to use for file operations.
 * @param {string} fileName - The name of the file to upload.
 * @returns {Promise<string>} The ID of the newly created file.
 */
async function _createNewFile(openAiInstance, fileName) {
  // Отримуємо повний шлях до файлу
  const filePath = path.resolve(`${process.env.FOLDER_NAME}/${fileName}`);

  // Перевіряємо чи файл існує
  if (!fs.existsSync(filePath)) {
    throw new Error(
      chalk.red(
        `❌ Файл ${chalk.red.bold.underline(
          fileName
        )} не знайдено. Додайте файл у папку ${chalk.blue.bold.underline(
          process.env.FOLDER_NAME
        )}.`
      )
    );
  }

  // Завантажуємо файл на OpenAI
  const file = await openAiInstance.files.create({
    file: fs.createReadStream(filePath),
    purpose: "assistants",
  });

  console.log(
    chalk.green(`✔️ Файл ${chalk.green.bold.underline(fileName)} створено.`)
  );
  return file.id;
}

/**
 * Asynchronously retrieves the vector store ID from OpenAI's vector store list.
 * If no vector stores are found, it creates a new vector store and returns its ID.
 * @async
 *
 * @param {OpenAI} openAiInstance - The OpenAI instance to use for vector store operations.
 * @param {Array<string>} fileIds - Array of file IDs to upload to the vector store.
 * @returns {Promise<string>} The ID of the existing or newly created vector store.
 * @throws Will throw an error if the vector store creation or retrieval fails.
 */
export async function getVectorStoreId(openAiInstance, fileIds) {
  try {
    if (!fileIds) {
      throw new Error(chalk.red("❌ Не вказано ID файлу."));
    }
    if (!openAiInstance) {
      throw new Error(chalk.red("❌ Не вказано екземпляр OpenAI."));
    }

    const vectorStoreName =
      process.env.VECTOR_STORE_NAME ||
      `vector-store_${new Date().getDate()}_${
        new Date().getMonth() + 1
      }_${new Date().getFullYear()}`;

    await checkAndRemoveExistingVectorStore(openAiInstance, vectorStoreName);

    // Створюємо векторне сховище, яке буде містити вектори з наших файлів
    let vectorStore = await openAiInstance.beta.vectorStores.create({
      name: vectorStoreName,
      file_ids: fileIds,
      expires_after: {
        anchor: "last_active_at",
        days: 7,
      },
    });

    // // Завантажуємо файли в векторне сховище
    // await openAiInstance.beta.vectorStores.fileBatches.create(vectorStore.id, {
    //   file_ids: fileIds,
    // });

    console.log(
      chalk.green(
        `✔️ Файл(и) ${chalk.green.bold.underline(
          fileIds.join(", ")
        )} завантажені у векторне сховище.`
      )
    );
    return vectorStore.id;
  } catch (error) {
    throw new Error(chalk.red("❌ Помилка: ") + error.message);
  }
}

/**
 * Checks for existing vector stores with the given name and removes them if found.
 *
 * @async
 * @function checkAndRemoveExistingVectorStore
 * @param {Object} openAiInstance - The instance of the OpenAI API.
 * @param {string} vectorStoreName - The name of the vector store to check and remove.
 * @throws Will throw an error if the operation fails.
 */
async function checkAndRemoveExistingVectorStore(
  openAiInstance,
  vectorStoreName
) {
  try {
    const vectorStores = await openAiInstance.beta.vectorStores.list({
      limit: 100,
    });
    const targetVectorStores =
      vectorStores?.data?.filter(
        (vectorStore) => vectorStore.name === vectorStoreName
      ) || [];

    if (targetVectorStores?.length) {
      console.log(
        chalk.yellow(
          `⚠ Векторне сховище ${chalk.green.bold(
            vectorStoreName
          )} вже існує. Видалення векторних сховищ: ${chalk.grey.bold(
            targetVectorStores.map((vectorStore) => vectorStore.id).join(", ")
          )}`
        )
      );

      // Видаляємо всі існуючі векторні сховища
      await Promise.all(
        targetVectorStores.map(async (vectorStore) => {
          try {
            await openAiInstance.beta.vectorStores.del(vectorStore.id);
            console.log(
              chalk.green(
                `✔️ Векторне сховище ${chalk.green.bold(
                  vectorStore.name
                )}, ID: ${chalk.grey.bold(vectorStore.id)} видалено.`
              )
            );
          } catch (error) {
            console.error(
              chalk.red(
                `❌ Помилка при видаленні сховища ${vectorStore.name}:`,
                error
              )
            );
          }
        })
      );
    }
  } catch (error) {
    throw new Error(chalk.red("❌ Помилка: ") + error.message);
  }
}
