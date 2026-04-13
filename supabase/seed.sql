-- dooooz seed data: 10 characters + 40 badges

-- ============================================================
-- Characters (10)
-- ============================================================
insert into characters (id, name, unlock_level, asset_base_path) values
  ('fox',     'Fox',     0,  '/characters/fox'),
  ('bear',    'Bear',    0,  '/characters/bear'),
  ('cat',     'Cat',     0,  '/characters/cat'),
  ('rabbit',  'Rabbit',  0,  '/characters/rabbit'),
  ('penguin', 'Penguin', 0,  '/characters/penguin'),
  ('panda',   'Panda',   0,  '/characters/panda'),
  ('lion',    'Lion',    0,  '/characters/lion'),
  ('owl',     'Owl',     0,  '/characters/owl'),
  ('dragon',  'Dragon',  16, '/characters/dragon'),
  ('unicorn', 'Unicorn', 16, '/characters/unicorn'),
  ('tiger',   'Tiger',   0,  '/characters/tiger'),
  ('hamster', 'Hamster', 0,  '/characters/hamster')
on conflict (id) do nothing;

-- ============================================================
-- Badges (40)
-- ============================================================
insert into badges (id, name, description, icon, rule_type, rule_value) values
  -- Completion count (9)
  ('first_step',     'First Step',     'Complete your first chore',            '🌱', 'total_count', 1),
  ('ten_done',       'Ten Done',       'Complete 10 chores',                   '🔟', 'total_count', 10),
  ('fifty_done',     'Fifty Done',     'Complete 50 chores',                   '⭐', 'total_count', 50),
  ('hundred_club',   'Hundred Club',   'Complete 100 chores',                  '💯', 'total_count', 100),
  ('five_hundred',   'Five Hundred',   'Complete 500 chores',                  '🏅', 'total_count', 500),
  ('thousand_legend','Thousand Legend','Complete 1,000 chores',                '🏆', 'total_count', 1000),
  ('done_3000',      'Three Thousand', 'Complete 3,000 chores',                '👑', 'total_count', 3000),
  ('done_10000',     'Ten Thousand',   'Complete 10,000 chores',               '💎', 'total_count', 10000),
  ('done_30000',     'Thirty Thousand','Complete 30,000 chores',               '🌟', 'total_count', 30000),

  -- Streaks (8)
  ('streak_3',    '3-Day Streak',    'Complete at least one chore 3 days in a row',  '🔥', 'streak', 3),
  ('streak_7',    '7-Day Streak',    'Week-long streak',                              '🔥', 'streak', 7),
  ('streak_14',   '14-Day Streak',   'Two-week streak',                               '🔥', 'streak', 14),
  ('streak_30',   '30-Day Streak',   'Month-long streak',                             '🔥', 'streak', 30),
  ('streak_100',  '100-Day Streak',  'Triple-digit streak',                           '🔥', 'streak', 100),
  ('streak_365',  'Year Streak',     '365-day streak',                                '🔥', 'streak', 365),
  ('streak_500',  '500-Day Streak',  '500-day streak',                                '🔥', 'streak', 500),
  ('streak_1000', '1000-Day Streak', '1000-day streak',                               '🔥', 'streak', 1000),
  ('streak_50',   '50-Day Streak',   '50-day streak',                                 '🔥', 'streak', 50),

  -- Lifetime points (6)
  ('saver_500',   'Saver 500',    'Earn 500 lifetime points',     '💰', 'lifetime_points', 500),
  ('saver_3000',  'Saver 3K',     'Earn 3,000 lifetime points',   '💰', 'lifetime_points', 3000),
  ('saver_10000', 'Saver 10K',    'Earn 10,000 lifetime points',  '💰', 'lifetime_points', 10000),
  ('saver_50k',   'Saver 50K',    'Earn 50,000 lifetime points',  '💰', 'lifetime_points', 50000),
  ('saver_100k',  'Saver 100K',   'Earn 100,000 lifetime points', '💰', 'lifetime_points', 100000),
  ('saver_500k',  'Saver 500K',   'Earn 500,000 lifetime points', '💰', 'lifetime_points', 500000),

  -- Redemption (2)
  ('first_reward', 'First Reward', 'Redeem your first reward',         '🎁', 'redemption', 1),
  ('big_spender',  'Big Spender',  'Redeem a reward costing 1,000+ points', '💸', 'redemption', 1000),

  -- Perfect (2)
  ('perfect_day',  'Perfect Day',  'Complete every chore in a day',  '✨', 'perfect_day', 1),
  ('perfect_week', 'Perfect Week', 'Complete every chore in a week', '✨', 'perfect_week', 1),

  -- Difficulty (1)
  ('hard_worker',  'Hard Worker',  'Complete 50 hard chores',        '💪', 'hard_worker', 50),

  -- Time (1)
  ('early_bird',   'Early Bird',   'Complete a chore before 8 AM',   '🌅', 'time_condition', 8),

  -- Goals (4)
  ('goal_crusher', 'Goal Crusher', 'Complete your first goal',       '🎯', 'goal_count', 1),
  ('goal_master',  'Goal Master',  'Complete 10 goals',              '🎯', 'goal_count', 10),
  ('goal_50',      'Goal 50',      'Complete 50 goals',              '🎯', 'goal_count', 50),
  ('goal_100',     'Goal 100',     'Complete 100 goals',             '🎯', 'goal_count', 100),

  -- Anniversary (6)
  ('anniv_100d', '100 Days',  '100 days with dooooz',  '🎂', 'anniversary', 100),
  ('anniv_1y',   '1 Year',    '1 year with dooooz',    '🎂', 'anniversary', 365),
  ('anniv_2y',   '2 Years',   '2 years with dooooz',   '🎂', 'anniversary', 730),
  ('anniv_3y',   '3 Years',   '3 years with dooooz',   '🎂', 'anniversary', 1095),
  ('anniv_5y',   '5 Years',   '5 years with dooooz',   '🎂', 'anniversary', 1825),
  ('anniv_10y',  '10 Years',  '10 years with dooooz',  '🎂', 'anniversary', 3650)
on conflict (id) do nothing;
