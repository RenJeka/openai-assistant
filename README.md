# Open AI assistant

## Description

A simple implementation of Open AI assistant for study purpose.
The assistant can:

- Create itself
- put user message into thread
- add file to OpenAI to vector store
- take the file as a contecst and instructions from files
- base on instructions and file(s) answer to user via console

## Installation and seting-up

install project and it's dependencies:

```bash
# Clone the repository
git clone https://github.com/yourusername/openai-assistant.git

# Navigate to the project directory
cd openai-assistant

# Install dependencies
npm i
```

## Set-up first run:

1. Put you file into `files` folder
2. Fill `assistant_instructions.md` file with instruction for the assistant.
3. Make a copy of file `.env.examle` rename it to `.env` and fill it with correct data (tokens, vector store name, file name ... etc.); File name should be WITH EXTENSION! (examp: `my_schedule.docx`).

# Usage

### Run the project

```
npm start
```

# Contributing

Guidelines for contributing to the project:

1. Fork the repository
2. Create a new branch (git checkout -b feature-branch)
3. Make your changes
4. Commit your changes (git commit -m 'Add some feature')
5. Push to the branch (git push origin feature-branch)
6. Open a pull request
