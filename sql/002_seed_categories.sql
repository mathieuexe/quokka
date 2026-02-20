INSERT INTO categories (slug, label, image_url)
VALUES
  ('arma-3', 'Arma 3', '/images/categories/arma-3.png'),
  ('bedrock', 'Bedrock', '/images/categories/bedrock.png'),
  ('counter-strike', 'Counter Strike', '/images/categories/counter-strike.png'),
  ('discord', 'Discord', '/images/categories/discord.png'),
  ('stoat', 'Stoat', '/images/categories/stoat.png'),
  ('garrys-mod', 'Garry''s Mod', '/images/categories/garrys-mod.png'),
  ('minecraft', 'Minecraft', '/images/categories/minecraft.png'),
  ('gta-v-fivem', 'GTA V (FiveM)', '/images/categories/gta-v-fivem.png'),
  ('hytale', 'Hytale', '/images/categories/hytale.png'),
  ('rust', 'Rust', '/images/categories/rust.png'),
  ('roblox', 'Roblox', '/images/categories/roblox.png')
ON CONFLICT (slug) DO NOTHING;
