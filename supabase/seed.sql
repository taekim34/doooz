-- dooooz seed data: 12 characters + 58 badges

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
-- Badges (58)
-- ============================================================
insert into badges (id, name, description, icon, rule_type, rule_value, sort_order) values
  -- Completion count (9)
  ('first_step',     '첫 걸음',       '첫 번째 할일 완료',             '🌱', 'total_count', 1, 1),
  ('ten_done',       '10개 완료',     '할일 10개 완료',                '🔟', 'total_count', 10, 2),
  ('fifty_done',     '50개 완료',     '할일 50개 완료',                '⭐', 'total_count', 50, 3),
  ('hundred_club',   '100개 클럽',    '할일 100개 완료',               '💯', 'total_count', 100, 4),
  ('five_hundred',   '500개 달성',    '할일 500개 완료',               '🏅', 'total_count', 500, 5),
  ('thousand_legend','천 개의 전설',  '할일 1,000개 완료',             '🏆', 'total_count', 1000, 6),
  ('done_3000',      '삼천 달성',     '할일 3,000개 완료',             '👑', 'total_count', 3000, 7),
  ('done_10000',     '만 개 돌파',    '할일 10,000개 완료',            '💎', 'total_count', 10000, 8),
  ('done_30000',     '삼만 달성',     '할일 30,000개 완료',            '🌟', 'total_count', 30000, 9),

  -- Streaks (9)
  ('streak_3',    '3일 연속',    '3일 연속 할일 완료',    '🔥', 'streak', 3, 10),
  ('streak_7',    '7일 연속',    '7일 연속 할일 완료',    '🔥', 'streak', 7, 11),
  ('streak_14',   '14일 연속',   '14일 연속 할일 완료',   '🔥', 'streak', 14, 12),
  ('streak_30',   '30일 연속',   '30일 연속 할일 완료',   '🔥', 'streak', 30, 13),
  ('streak_50',   '50일 연속',   '50일 연속 할일 완료',   '🔥', 'streak', 50, 14),
  ('streak_100',  '100일 연속',  '100일 연속 할일 완료',  '🔥', 'streak', 100, 15),
  ('streak_365',  '365일 연속',  '1년 연속 할일 완료',    '🔥', 'streak', 365, 16),
  ('streak_500',  '500일 연속',  '500일 연속 할일 완료',  '🔥', 'streak', 500, 17),
  ('streak_1000', '1000일 연속', '1000일 연속 할일 완료', '🔥', 'streak', 1000, 18),

  -- Lifetime points (6)
  ('saver_500',   '500pt 달성',   '누적 500pt 달성',       '💰', 'lifetime_points', 500, 20),
  ('saver_3000',  '3000pt 달성',  '누적 3,000pt 달성',     '💰', 'lifetime_points', 3000, 21),
  ('saver_10000', '만pt 달성',    '누적 10,000pt 달성',    '💰', 'lifetime_points', 10000, 22),
  ('saver_50k',   '5만pt 달성',   '누적 50,000pt 달성',    '💰', 'lifetime_points', 50000, 23),
  ('saver_100k',  '10만pt 달성',  '누적 100,000pt 달성',   '💰', 'lifetime_points', 100000, 24),
  ('saver_500k',  '50만pt 달성',  '누적 500,000pt 달성',   '💰', 'lifetime_points', 500000, 25),

  -- Perfect (7)
  ('perfect_day',   '완벽한 하루',    '하루 모든 할일 완료',         '✨', 'perfect_day', 1, 30),
  ('perfect_week',  '완벽한 한 주',   '월~일 모든 할일 달성',        '✨', 'perfect_week', 1, 31),
  ('perfect_month', '완벽한 한 달',   '1일~말일 모든 할일 달성',     '✨', 'perfect_month', 1, 32),
  ('perfect_q1',    '완벽한 1분기',   '1~3월 모든 할일 달성',        '🏅', 'perfect_quarter', 1, 33),
  ('perfect_q2',    '완벽한 2분기',   '4~6월 모든 할일 달성',        '🏅', 'perfect_quarter', 2, 34),
  ('perfect_q3',    '완벽한 3분기',   '7~9월 모든 할일 달성',        '🏅', 'perfect_quarter', 3, 35),
  ('perfect_q4',    '완벽한 4분기',   '10~12월 모든 할일 달성',      '🏅', 'perfect_quarter', 4, 36),
  ('perfect_year',  '완벽한 1년',     '1~12월 모든 할일 달성',       '🌟', 'perfect_year', 1, 37),

  -- Anniversary (6)
  ('anniv_100d', '100일 기념',  '두즈와 함께한 100일',   '🎂', 'anniversary', 100, 40),
  ('anniv_1y',   '1년 기념',    '두즈와 함께한 1년',     '🎂', 'anniversary', 365, 41),
  ('anniv_2y',   '2년 기념',    '두즈와 함께한 2년',     '🎂', 'anniversary', 730, 42),
  ('anniv_3y',   '3년 기념',    '두즈와 함께한 3년',     '🎂', 'anniversary', 1095, 43),
  ('anniv_5y',   '5년 기념',    '두즈와 함께한 5년',     '🎂', 'anniversary', 1825, 44),
  ('anniv_10y',  '10년 기념',   '두즈와 함께한 10년',    '🎂', 'anniversary', 3650, 45),

  -- Time (1)
  ('early_bird', '얼리버드', '오후 2시 전에 할일 완료', '🌅', 'time_condition', 14, 50),

  -- Hard worker (6)
  ('hard_worker', '열심히 50',   '어려운 할일(150pt↑) 50개 완료',    '💪', 'hard_worker', 50, 51),
  ('hard_100',    '열심히 100',  '어려운 할일(150pt↑) 100개 완료',   '💪', 'hard_worker', 100, 52),
  ('hard_200',    '열심히 200',  '어려운 할일(150pt↑) 200개 완료',   '💪', 'hard_worker', 200, 53),
  ('hard_300',    '열심히 300',  '어려운 할일(150pt↑) 300개 완료',   '💪', 'hard_worker', 300, 54),
  ('hard_500',    '열심히 500',  '어려운 할일(150pt↑) 500개 완료',   '💪', 'hard_worker', 500, 55),
  ('hard_1000',   '열심히 1000', '어려운 할일(150pt↑) 1000개 완료',  '💪', 'hard_worker', 1000, 56),

  -- Big task (4)
  ('goal_crusher', '대형 목표 달성',  '1회성 1000pt↑ 할일 달성',       '🎯', 'big_task', 1, 57),
  ('goal_master',  '대형 목표 10',    '1회성 1000pt↑ 할일 10개 달성',  '🎯', 'big_task', 10, 58),
  ('goal_50',      '대형 목표 50',    '1회성 1000pt↑ 할일 50개 달성',  '🎯', 'big_task', 50, 59),
  ('goal_100',     '대형 목표 100',   '1회성 1000pt↑ 할일 100개 달성', '🎯', 'big_task', 100, 60),

  -- Redemption (3)
  ('first_reward', '첫 보상',   '첫 번째 보상 교환',                '🎁', 'redemption', 1, 61),
  ('big_spender',  '큰손',      '10,000pt 이상 보상 교환',          '💸', 'redemption', 10000, 68),
  ('mega_spender', '왕큰손',    '20,000pt 이상 보상 교환',          '💸', 'redemption', 20000, 69),

  -- Redemption count (6)
  ('redeem_10',  '보상 10회',   '보상 10회 교환',    '🎁', 'redemption_count', 10, 62),
  ('redeem_30',  '보상 30회',   '보상 30회 교환',    '🎁', 'redemption_count', 30, 63),
  ('redeem_50',  '보상 50회',   '보상 50회 교환',    '🎁', 'redemption_count', 50, 64),
  ('redeem_100', '보상 100회',  '보상 100회 교환',   '🎁', 'redemption_count', 100, 65),
  ('redeem_300', '보상 300회',  '보상 300회 교환',   '🎁', 'redemption_count', 300, 66),
  ('redeem_500', '보상 500회',  '보상 500회 교환',   '🎁', 'redemption_count', 500, 67)
on conflict (id) do nothing;
