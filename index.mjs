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
const handlers = new Map();

// コマンド読み込み関数
async function loadCommands() {
  try {
    console.log("=== Loading Commands ===");
    console.log("Current working directory:", Deno.cwd());
    
    // 直接インポートで確実に読み込み
    try {
      console.log("Loading ping.mjs...");
      const pingModule = await import("./commands/ping.mjs");
      if (pingModule.data && pingModule.data.name) {
        client.commands.set(pingModule.data.name, pingModule);
        console.log(`✓ Loaded command: ${pingModule.data.name}`);
      } else {
        console.error("✗ pingModule.data or pingModule.data.name is missing");
      }
    } catch (e) {
      console.error("✗ Failed to load ping.mjs:", e);
    }
    
    try {
      console.log("Loading playMusic.mjs...");
      const playModule = await import("./commands/playMusic.mjs");
      if (playModule.data && playModule.data.name) {
        client.commands.set(playModule.data.name, playModule);
        console.log(`✓ Loaded command: ${playModule.data.name}`);
      } else {
        console.error("✗ playModule.data or playModule.data.name is missing");
      }
    } catch (e) {
      console.error("✗ Failed to load playMusic.mjs:", e);
    }
    
    try {
      console.log("Loading stopMusic.mjs...");
      const stopModule = await import("./commands/stopMusic.mjs");
      if (stopModule.data && stopModule.data.name) {
        client.commands.set(stopModule.data.name, stopModule);
        console.log(`✓ Loaded command: ${stopModule.data.name}`);
      } else {
        console.error("✗ stopModule.data or stopModule.data.name is missing");
      }
    } catch (e) {
      console.error("✗ Failed to load stopMusic.mjs:", e);
    }
    
    console.log(`Total loaded commands: ${client.commands.size}`);
    console.log("Available commands:", Array.from(client.commands.keys()));
  } catch (error) {
    console.error("Error loading commands:", error);
  }
}

// ハンドラー読み込み関数
async function loadHandlers() {
  try {
    console.log("=== Loading Handlers ===");
    
    try {
      console.log("Loading interactionCreate.mjs...");
      const interactionHandler = await import("./handlers/interactionCreate.mjs");
      handlers.set("interactionCreate", interactionHandler);
      console.log("✓ Loaded interactionCreate handler");
    } catch (e) {
      console.error("✗ Failed to load interactionCreate.mjs:", e);
    }
    
    try {
      console.log("Loading sendNote.mjs...");
      const sendNoteHandler = await import("./handlers/sendNote.mjs");
      handlers.set("sendNote", sendNoteHandler);
      console.log("✓ Loaded sendNote handler");
    } catch (e) {
      console.error("✗ Failed to load sendNote.mjs:", e);
    }
    
    console.log("Total loaded handlers:", handlers.size);
    console.log("Available handlers:", Array.from(handlers.keys()));
  } catch (error) {
    console.error("Error loading handlers:", error);
  }
}

// イベントハンドラーを直接定義
client.on("interactionCreate", async (interaction) => {
  console.log("=== interactionCreate event triggered ===");
  console.log("Interaction type:", interaction.type);
  console.log("Is chat input command:", interaction.isChatInputCommand());
  
  if (!interaction.isChatInputCommand()) {
    console.log("Not a chat input command, returning");
    return;
  }
  
  console.log("Command name:", interaction.commandName);
  console.log("Available commands:", Array.from(client.commands.keys()));
  
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`「${interaction.commandName}」コマンドは見つかりませんでした。`);
    return;
  }

  console.log("Command found, executing...");

  try {
    await command.execute(interaction);
    console.log("Command executed successfully");
  } catch (error) {
    console.error("Error executing command:", error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
    } else {
      await interaction.reply({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
    }
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  console.log("=== messageReactionAdd event triggered ===");
  const handler = handlers.get("sendNote");
  if (handler) {
    await handler.default(reaction, user, client);
  } else {
    console.error("sendNote handler not found");
  }
});

client.on("ready", async () => {
  console.log("=== Bot is ready! ===");
  await client.user.setActivity('🐢', { type: ActivityType.Custom, state: "🐢を飼育中" });
  console.log(`${client.user.tag} がログインしました！`);
  
  // ボットがログインした後にコマンドを登録
  try {
    console.log("=== Registering commands ===");
    await CommandsRegister();
    console.log("✓ Commands registered successfully");
  } catch (error) {
    console.error("✗ Error registering commands:", error);
  }
});

// 初期化
async function initialize() {
  console.log("=== Starting initialization ===");
  await loadCommands();
  await loadHandlers();
  
  const token = Deno.env.get("TOKEN");
  if (!token) {
    console.error("✗ TOKEN environment variable not set!");
    return;
  }
  
  console.log("=== Logging in to Discord ===");
  await client.login(token);
}

initialize().catch(console.error);