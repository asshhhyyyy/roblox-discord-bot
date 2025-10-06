import { SlashCommandBuilder } from 'discord.js';
import noblox from 'noblox.js';

export default {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Sync your Discord roles (rank + division) with your Roblox profile'),
  async execute(interaction, { verifiedUsers }) {
    const discordId = interaction.user.id;
    const robloxId = verifiedUsers.get(discordId);

    if (!robloxId) {
      await interaction.reply({ content: '❌ You are not verified yet. Use /verify first.', ephemeral: true });
      return;
    }

    try {
      const member = await interaction.guild.members.fetch(discordId);

      // === 🎖️ RANK ROLES ===
      const rankRoles = {
        1: '1424719646593908816',  // Private
        2: '1424719706618728509',  // Corporal
        254: '1424719757927514123', // Sergeant
      };

      // === 🪖 DIVISION ROLES ===
      // (Each division corresponds to a Roblox group ID)
      const divisionRoles = [
        { name: 'Infantry', groupId: 32061514, roleId: '1424720139865292863' },
        { name: 'Navy', groupId: 12670631, roleId: '1424720174002733067' },
      ];

      // Get rank data from your main Roblox group
      const rankName = await noblox.getRankNameInGroup(process.env.GROUP_ID, robloxId);
      const rankId = await noblox.getRankInGroup(process.env.GROUP_ID, robloxId);

      // Remove all related roles before re-adding the correct ones
      const allRoles = [
        ...Object.values(rankRoles),
        ...divisionRoles.map(d => d.roleId)
      ];

      for (const roleId of allRoles) {
        if (member.roles.cache.has(roleId)) await member.roles.remove(roleId);
      }

      // ✅ Assign correct rank role
      const newRankRoleId = rankRoles[rankId];
      if (newRankRoleId) {
        await member.roles.add(newRankRoleId);
      }

      // ✅ Assign division roles based on Roblox group membership
      for (const div of divisionRoles) {
        const divisionRank = await noblox.getRankInGroup(div.groupId, robloxId);
        if (divisionRank > 0) { // player is in that division group
          await member.roles.add(div.roleId);
        }
      }

      await interaction.reply({
        content: `✅ Synced!\n**Rank:** ${rankName}\n**Divisions:** Checked Roblox group membership.`,
        ephemeral: true,
      });

    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: '⚠️ Something went wrong while syncing your roles.',
        ephemeral: true
      });
    }
  },
};
