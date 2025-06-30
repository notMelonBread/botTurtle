import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { REST, Routes } from "discord.js";

const commands = [];

export default async() => {
  const commandsPath = join(Deno.cwd(), 'commands');
  
  for await (const entry of walk(commandsPath, { exts: ['.mjs'] })) {
    const module = await import(`file://${entry.path}`);
    if (module.data) {
      commands.push(module.data.toJSON());
    }
  }

  const rest = new REST().setToken(Deno.env.get("TOKEN"));

  (async () => {
    try {
      console.log(`[INIT] ${commands.length}つのスラッシュコマンドを更新します。`);

      const data = await rest.put(
        Routes.applicationCommands(Deno.env.get("APPLICATION_ID")),
        { body: commands },
      );

      console.log(`[INIT] ${commands.length}つのスラッシュコマンドを更新しました。`);
    } catch (error) {
      console.error(error);
    }
  })();
};