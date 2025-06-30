export default async(interaction) => {
  console.log("=== interactionCreate handler called ===");
  console.log("Interaction type:", interaction.type);
  console.log("Is chat input command:", interaction.isChatInputCommand());
  
  if (!interaction.isChatInputCommand()) {
    console.log("Not a chat input command, returning");
    return;
  }
  
  console.log("Command name:", interaction.commandName);
  console.log("Available commands in client:", Array.from(interaction.client.commands.keys()));
  
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`「${interaction.commandName}」コマンドは見つかりませんでした。`);
    console.log("Available commands:", Array.from(interaction.client.commands.keys()));
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
};
