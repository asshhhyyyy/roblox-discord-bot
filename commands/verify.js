import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Link your Roblox account to your Discord account'),
  async execute(interaction, { verifyCodes }) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verifyCodes.set(interaction.user.id, code);
    await interaction.reply({
      content: `Your verification code is **${code}**.\nGo to the Roblox game and enter this code!`,
      ephemeral: true,
    });
  },
};
