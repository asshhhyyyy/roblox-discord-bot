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
        1: '120000000000000000',  // Private
        5: '120000000000000001',  // Corporal
        10: '120000000000000002', // Sergeant
        15: '120000000000000003', // Lieutenant
        20: '120000000000000004', // Captain
        25: '120000000000000005', // Major
        30: '120000000000000006', // Colonel
        35: '120000000000000007'  // General
      };

      // === 🪖 DIVISION ROLES ===
      // (Each division corresponds to a Roblox group ID)
      const divisionRoles = [
        { name: 'Infantry', groupId: 1234567, roleId: '130000000000000001' },
        { name: 'Navy', groupId: 2345678, roleId: '130000000000000002' },
        { name: 'Air Wing', groupId: 3456789, roleId: '130000000000000003' },
        { name: 'Special Forces', groupId: 4567890, roleId: '130000000000000004' },
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
