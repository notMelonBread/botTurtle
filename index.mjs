import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
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

// Deno用のコマンド読み込み
const commandsPath = join(Deno.cwd(), "commands");
for await (const entry of walk(commandsPath, { exts: [".mjs"] })) {
  const module = await import(`file://${entry.path}`);
  if (module.data && module.data.name) {
    client.commands.set(module.data.name, module);
  } else {
    console.warn(`Skipping command file ${entry.name} due to missing or invalid data.name.`);
  }
}

const handlers = new Map();

// Deno用のハンドラー読み込み
const handlersPath = join(Deno.cwd(), "handlers");
for await (const entry of walk(handlersPath, { exts: [".mjs"] })) {
  const module = await import(`file://${entry.path}`);
  handlers.set(entry.name.slice(0, -4), module);
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

CommandsRegister();
client.login(Deno.env.get("TOKEN"));