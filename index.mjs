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
app.get("/debug", (req, res) => {
  res.json({
    status: "running",
    commands: Array.from(client.commands.keys()),
    handlers: Array.from(handlers.keys()),
    env: {
      hasToken: !!Deno.env.get("TOKEN"),
      hasApplicationId: !!Deno.env.get("APPLICATION_ID")
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

// コマンド読み込み関数
async function loadCommands() {
  try {
    console.log("Current working directory:", Deno.cwd());
    
    // 方法1: walkを使用
    try {
      const commandsPath = join(Deno.cwd(), "commands");
      console.log("Loading commands from:", commandsPath);
      
      for await (const entry of walk(commandsPath, { exts: [".mjs"] })) {
        console.log("Loading command file:", entry.path);
        const module = await import(`file://${entry.path}`);
        if (module.data && module.data.name) {
          client.commands.set(module.data.name, module);
          console.log(`Loaded command: ${module.data.name}`);
        } else {
          console.warn(`Skipping command file ${entry.name} due to missing or invalid data.name.`);
        }
      }
    } catch (error) {
      console.log("Walk method failed, trying direct imports...");
      
      // 方法2: 直接インポート
      try {
        const playModule = await import("./commands/playMusic.mjs");
        if (playModule.data && playModule.data.name) {
          client.commands.set(playModule.data.name, playModule);
          console.log(`Loaded command: ${playModule.data.name}`);
        }
      } catch (e) {
        console.error("Failed to load playMusic.mjs:", e);
      }
      
      try {
        const stopModule = await import("./commands/stopMusic.mjs");
        if (stopModule.data && stopModule.data.name) {
          client.commands.set(stopModule.data.name, stopModule);
          console.log(`Loaded command: ${stopModule.data.name}`);
        }
      } catch (e) {
        console.error("Failed to load stopMusic.mjs:", e);
      }
    }
    
    console.log(`Total loaded commands: ${client.commands.size}`);
  } catch (error) {
    console.error("Error loading commands:", error);
  }
}

// ハンドラー読み込み関数
async function loadHandlers() {
  try {
    console.log("Loading handlers...");
    
    // 方法1: walkを使用
    try {
      const handlersPath = join(Deno.cwd(), "handlers");
      console.log("Loading handlers from:", handlersPath);
      
      for await (const entry of walk(handlersPath, { exts: [".mjs"] })) {
        console.log("Loading handler file:", entry.path);
        const module = await import(`file://${entry.path}`);
        handlers.set(entry.name.slice(0, -4), module);
      }
    } catch (error) {
      console.log("Walk method failed for handlers, trying direct imports...");
      
      // 方法2: 直接インポート
      try {
        const interactionHandler = await import("./handlers/interactionCreate.mjs");
        handlers.set("interactionCreate", interactionHandler);
        console.log("Loaded interactionCreate handler");
      } catch (e) {
        console.error("Failed to load interactionCreate.mjs:", e);
      }
      
      try {
        const sendNoteHandler = await import("./handlers/sendNote.mjs");
        handlers.set("sendNote", sendNoteHandler);
        console.log("Loaded sendNote handler");
      } catch (e) {
        console.error("Failed to load sendNote.mjs:", e);
      }
    }
  } catch (error) {
    console.error("Error loading handlers:", error);
  }
}

const handlers = new Map();

client.on("interactionCreate", async (interaction) => {
  console.log("Interaction received:", interaction.type);
  if (interaction.isChatInputCommand()) {
    console.log("Command interaction:", interaction.commandName);
    console.log("Available commands:", Array.from(client.commands.keys()));
  }
  
  const handler = handlers.get("interactionCreate");
  if (handler) {
    await handler.default(interaction);
  } else {
    console.error("interactionCreate handler not found");
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  const handler = handlers.get("sendNote");
  if (handler) {
    await handler.default(reaction, user, client);
  }
});

client.on("ready", async () => {
  console.log("Bot is ready!");
  await client.user.setActivity('🐢', { type: ActivityType.Custom, state: "🐢を飼育中" });
  console.log(`${client.user.tag} がログインしました！`);
  
  // ボットがログインした後にコマンドを登録
  try {
    await CommandsRegister();
    console.log("Commands registered successfully");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
});

// 初期化
async function initialize() {
  await loadCommands();
  await loadHandlers();
  await client.login(Deno.env.get("TOKEN"));
}

initialize().catch(console.error);