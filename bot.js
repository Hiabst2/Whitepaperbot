const Discord = require('discord.js');
const fetch = require('node-fetch');
const { OpenAI } = require('openai');

// Set up the Discord client
const client = new Discord.Client();

// Set up the OpenAI API key and model ID
const openaiApiKey = process.env.OPENAI_API_KEY
const openaiModelId = 'text-davinci-002';

// Set up the channel where the bot will respond
let answerChannel = null;

// Set up the website link to scrape
let websiteLink = null;

// Log in to the Discord client
client.login(process.env.DISCORD_BOT_TOKEN);

// When the Discord client is ready, set up the answer channel and website link
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Listen for messages in the answer channel
client.on('message', async (message) => {
  if (message.channel.id === answerChannel && message.author.id !== client.user.id) {
    // Fetch the website HTML
    const websiteHtml = await fetchWebsite(websiteLink);

    // Send the question to the OpenAI API and get the answer
    const answer = await getAnswerFromOpenAI(message.content, websiteHtml);

    // Send the answer back to the answer channel
    message.reply(answer);
  }
});

// Set up the answer channel for the bot
client.on('message', (message) => {
  if (message.content.startsWith('!answer-channel')) {
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      message.reply('You do not have permission to use this command.');
      return;
    }

    answerChannel = message.mentions.channels.first();
    if (!answerChannel) {
      message.reply('Please mention a valid channel.');
    } else {
      message.reply(`Answer channel set to ${answerChannel}`);
    }
  }
});

// Set up the website link for the bot
client.on('message', (message) => {
  if (message.content.startsWith('!website-link')) {
    if (!message.member.hasPermission('ADMINISTRATOR')) {
      message.reply('You do not have permission to use this command.');
      return;
    }

    websiteLink = message.content.split(' ')[1];
    if (!websiteLink) {
      message.reply('Please provide a valid link.');
    } else {
      message.reply(`Website link set to ${websiteLink}`);
    }
  }
});

// Function to fetch the HTML content of a website
async function fetchWebsite(link) {
  // Use a fetch library to fetch the HTML content of the website
  const response = await fetch(link);
  const html = await response.text();
  return html;
}

// Function to send the question to OpenAI API and get the answer
async function getAnswerFromOpenAI(question, websiteHtml) {
  // Set up the OpenAI API client
  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Set up the prompt for the OpenAI API
  const prompt = `Given the following text, answer the question:\n\n${websiteHtml}\n\nQuestion: ${question}\nAnswer:`;

  // Set up the parameters for the OpenAI API request
  const requestParams = {
    model: openaiModelId,
    prompt: prompt,
    maxTokens: 2048,
    n: 1,
    stop: '\n',
  };

  // Send the question to the OpenAI API and get the answer
  const response = await openai.complete(requestParams);
  const answer = response.choices[0].text.trim();
  return answer;
}
