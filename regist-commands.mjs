import * as fs from 'fs';
import * as path from 'path';
import { REST, Routes } from 'discord.js';

const commands = [];
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.mjs'));

export default async() => {
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    await import(filePath).then(module => {
      if (module.data) {
        commands.push(module.data.toJSON());
      }
    }).catch(error => {
      console.error(`Failed to load command file ${file}:`, error);
    });
  }

  const rest = new REST().setToken(process.env.TOKEN);

  (async () => {
    try {
      console.log(`[INIT] ${commands.length}つのスラッシュコマンドを更新します。`);

      const data = await rest.put(
        Routes.applicationCommands(process.env.APPLICATION_ID),
        { body: commands },
      );

      const dataGuild = await rest.put(
        Routes.applicationCommands(process.env.APPLICATION_ID),
        { body: commands },
      );

      console.log(`[INIT] ${commands.length}つのスラッシュコマンドを更新しました。`);
    } catch (error) {
      console.error(error);
    }
  })();
};