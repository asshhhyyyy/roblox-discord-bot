import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import express from 'express';
import noblox from 'noblox.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const app = express();
app.use(express.json());

// --- In-memory storage (replace with database later if needed)
const verifyCodes = new Map(); // DiscordID -> Code
const verifiedUsers = new Map(); // DiscordID -> RobloxID

// --- Slash commands setup
import verifyCmd from './commands/verify.js';
import updateCmd from './commands/update.js';
client.commands.set(verifyCmd.data.name, verifyCmd);
client.commands.set(updateCmd.data.name, updateCmd);

// --- Register commands
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
  const commands = [verifyCmd.data.toJSON(), updateCmd.data.toJSON()];
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
  console.log('✅ Slash commands registered.');
})();

// --- Command handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  await command.execute(interaction, { verifyCodes, verifiedUsers });
});

// --- Express endpoint for Roblox verification
app.post('/verify', (req, res) => {
  const { code, robloxId } = req.body;
  const discordId = [...verifyCodes.entries()].find(([_, c]) => c === code)?.[0];
  if (!discordId) return res.status(400).json({ error: 'Invalid code' });

  verifiedUsers.set(discordId, robloxId);
  verifyCodes.delete(discordId);
  console.log(`✅ Verified Discord ${discordId} as Roblox ${robloxId}`);
  return res.json({ success: true });
});

// --- Start web server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Listening on port ${PORT}`));

// --- Start bot
client.login(process.env.TOKEN);
