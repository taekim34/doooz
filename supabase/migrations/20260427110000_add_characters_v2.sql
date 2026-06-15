-- Add 10 new characters: 6 cute monsters (unlock L8) + 4 mythical creatures (unlock L16).
-- Existing 12 animals stay as-is (10 free, dragon/unicorn at L16).

insert into public.characters (id, name, unlock_level, asset_base_path) values
  -- Cute monsters — unlock at L8 (10K lifetime)
  ('mono',    'Mono',    8,  '/characters/mono'),
  ('jellu',   'Jellu',   8,  '/characters/jellu'),
  ('pinku',   'Pinku',   8,  '/characters/pinku'),
  ('honey',   'Honey',   8,  '/characters/honey'),
  ('leaf',    'Leaf',    8,  '/characters/leaf'),
  ('frost',   'Frost',   8,  '/characters/frost'),
  -- Mythical creatures — unlock at L16 (45K lifetime under new linear curve)
  ('gumiho',  'Gumiho',  16, '/characters/gumiho'),
  ('griffin', 'Griffin', 16, '/characters/griffin'),
  ('pegasus', 'Pegasus', 16, '/characters/pegasus'),
  ('phoenix', 'Phoenix', 16, '/characters/phoenix')
on conflict (id) do nothing;
