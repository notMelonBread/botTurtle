import fs from "fs";
import path from "path";
import express from "express";
import { 
  Client, 
  Collection, 
  Events, 
  GatewayIntentBits, 
  Partials, 
  ActivityType, 
  EmbedBuilder 
} from "discord.js";
import CommandsRegister from "./regist-commands.mjs";

const app = express();
app.get("/", (req, res) => res.send("Bot is running!"));
app.get("/debug", (req, res) => {
  res.json({
    status: "running",
    commands: Array.from(client.commands.keys()),
    handlers: Array.from(handlers.keys()),
    env: {
      hasToken: !!process.env.TOKEN,
      hasApplicationId: !!process.env.APPLICATION_ID
    }
  });
});
app.listen(3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();

const commandsPath = path.join(process.cwd(), "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".mjs"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  import(filePath).then((module) => {
    if (module.data && module.data.name) {
      client.commands.set(module.data.name, module);
    } else {
      console.warn(`Skipping command file ${file} due to missing or invalid data.name.`);
    }
  }).catch(error => {
    console.error(`Failed to load command file ${file}:`, error);
  });
}

const handlers = new Map();

const handlersPath = path.join(process.cwd(), "handlers");
const handlerFiles = fs.readdirSync(handlersPath).filter((file) => file.endsWith(".mjs"));

for (const file of handlerFiles) {
  const filePath = path.join(handlersPath, file);
  import(filePath).then((module) => {
    handlers.set(file.slice(0, -4), module);
  });
}

client.on("interactionCreate", async (interaction) => {
  await handlers.get("interactionCreate").default(interaction);
});

client.on("messageReactionAdd", async (reaction, user) => {
  await handlers.get("sendNote").default(reaction, user, client);
});

client.on("ready", async () => {
  await client.user.setActivity('🐢', { type: ActivityType.Custom, state: "🐢を飼育中" });
  console.log(`${client.user.tag} がログインしました！`);
});

await CommandsRegister();
client.login(process.env.TOKEN);