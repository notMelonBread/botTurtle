import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { REST, Routes } from "discord.js";

const commands = [];

export default async() => {
  try {
    console.log("Starting command registration...");
    
    const commandsPath = join(Deno.cwd(), 'commands');
    console.log("Commands path:", commandsPath);
    
    // コマンドファイルを読み込み
    for await (const entry of walk(commandsPath, { exts: ['.mjs'] })) {
      console.log("Processing command file:", entry.path);
      try {
        const module = await import(`file://${entry.path}`);
        if (module.data) {
          const commandData = module.data.toJSON();
          commands.push(commandData);
          console.log(`Added command: ${commandData.name}`);
        } else {
          console.warn(`No data found in ${entry.name}`);
        }
      } catch (error) {
        console.error(`Failed to load command file ${entry.name}:`, error);
      }
    }

    console.log(`Total commands to register: ${commands.length}`);
    
    if (commands.length === 0) {
      console.error("No commands found to register!");
      return;
    }

    const token = Deno.env.get("TOKEN");
    const applicationId = Deno.env.get("APPLICATION_ID");
    
    if (!token) {
      console.error("TOKEN environment variable not set!");
      return;
    }
    
    if (!applicationId) {
      console.error("APPLICATION_ID environment variable not set!");
      return;
    }

    console.log("Token and Application ID found, registering commands...");

    const rest = new REST().setToken(token);

    const data = await rest.put(
      Routes.applicationCommands(applicationId),
      { body: commands },
    );

    console.log(`Successfully registered ${commands.length} commands:`, data);
    
  } catch (error) {
    console.error("Error during command registration:", error);
    throw error;
  }
};