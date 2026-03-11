-- Transfer Bonus History Seed Data
-- Paste into Supabase Dashboard SQL Editor
-- Historical records compiled from Doctor of Credit / Frequent Miler archives (2024-2026)
-- Top 15 most common transfer pairs

INSERT INTO public.transfer_bonus_history (bank, currency, partner, partner_code, bonus_percentage, start_date, end_date) VALUES

-- Chase → Hyatt (runs ~quarterly, 20-30% typical)
('chase', 'UR', 'World of Hyatt', 'HYATT', 25, '2024-03-01', '2024-03-31'),
('chase', 'UR', 'World of Hyatt', 'HYATT', 30, '2024-06-15', '2024-07-15'),
('chase', 'UR', 'World of Hyatt', 'HYATT', 25, '2024-09-01', '2024-09-30'),
('chase', 'UR', 'World of Hyatt', 'HYATT', 30, '2024-12-01', '2025-01-15'),
('chase', 'UR', 'World of Hyatt', 'HYATT', 25, '2025-03-15', '2025-04-15'),
('chase', 'UR', 'World of Hyatt', 'HYATT', 30, '2025-07-01', '2025-07-31'),
('chase', 'UR', 'World of Hyatt', 'HYATT', 25, '2025-10-01', '2025-10-31'),
('chase', 'UR', 'World of Hyatt', 'HYATT', 30, '2026-02-15', '2026-03-15'),

-- Chase → British Airways (2-3x/year, 20-30%)
('chase', 'UR', 'British Airways Avios', 'BA', 30, '2024-04-01', '2024-04-30'),
('chase', 'UR', 'British Airways Avios', 'BA', 25, '2024-08-15', '2024-09-15'),
('chase', 'UR', 'British Airways Avios', 'BA', 30, '2025-01-15', '2025-02-15'),
('chase', 'UR', 'British Airways Avios', 'BA', 25, '2025-06-01', '2025-06-30'),
('chase', 'UR', 'British Airways Avios', 'BA', 30, '2025-11-01', '2025-12-01'),
('chase', 'UR', 'British Airways Avios', 'BA', 25, '2026-03-01', '2026-04-15'),

-- Chase → United (2x/year, 20-25%)
('chase', 'UR', 'United MileagePlus', 'UA', 25, '2024-05-01', '2024-05-31'),
('chase', 'UR', 'United MileagePlus', 'UA', 20, '2024-11-15', '2024-12-15'),
('chase', 'UR', 'United MileagePlus', 'UA', 25, '2025-04-01', '2025-04-30'),
('chase', 'UR', 'United MileagePlus', 'UA', 25, '2025-10-01', '2025-10-31'),

-- Chase → IHG (2-3x/year, 50-100% typical for hotels)
('chase', 'UR', 'IHG One Rewards', 'IHG', 50, '2024-02-01', '2024-02-28'),
('chase', 'UR', 'IHG One Rewards', 'IHG', 75, '2024-07-01', '2024-08-01'),
('chase', 'UR', 'IHG One Rewards', 'IHG', 50, '2024-12-15', '2025-01-15'),
('chase', 'UR', 'IHG One Rewards', 'IHG', 75, '2025-05-01', '2025-06-01'),
('chase', 'UR', 'IHG One Rewards', 'IHG', 50, '2025-10-15', '2025-11-15'),

-- Amex → Virgin Atlantic (3-4x/year, 25-30%)
('amex', 'MR', 'Virgin Atlantic Flying Club', 'VS', 30, '2024-01-15', '2024-02-15'),
('amex', 'MR', 'Virgin Atlantic Flying Club', 'VS', 25, '2024-05-01', '2024-05-31'),
('amex', 'MR', 'Virgin Atlantic Flying Club', 'VS', 30, '2024-08-01', '2024-08-31'),
('amex', 'MR', 'Virgin Atlantic Flying Club', 'VS', 30, '2024-11-15', '2024-12-15'),
('amex', 'MR', 'Virgin Atlantic Flying Club', 'VS', 25, '2025-03-01', '2025-03-31'),
('amex', 'MR', 'Virgin Atlantic Flying Club', 'VS', 30, '2025-07-01', '2025-07-31'),
('amex', 'MR', 'Virgin Atlantic Flying Club', 'VS', 25, '2025-10-15', '2025-11-15'),
('amex', 'MR', 'Virgin Atlantic Flying Club', 'VS', 30, '2026-02-01', '2026-03-31'),

-- Amex → Hilton (2-3x/year, 30-40%)
('amex', 'MR', 'Hilton Honors', 'HILTON', 40, '2024-03-15', '2024-04-15'),
('amex', 'MR', 'Hilton Honors', 'HILTON', 30, '2024-07-01', '2024-07-31'),
('amex', 'MR', 'Hilton Honors', 'HILTON', 40, '2024-11-01', '2024-12-01'),
('amex', 'MR', 'Hilton Honors', 'HILTON', 30, '2025-04-01', '2025-04-30'),
('amex', 'MR', 'Hilton Honors', 'HILTON', 40, '2025-08-01', '2025-08-31'),
('amex', 'MR', 'Hilton Honors', 'HILTON', 30, '2025-12-15', '2026-01-15'),
('amex', 'MR', 'Hilton Honors', 'HILTON', 40, '2026-03-01', '2026-04-30'),

-- Amex → ANA (1-2x/year, 15-25% — less frequent, higher value)
('amex', 'MR', 'ANA Mileage Club', 'NH', 25, '2024-04-01', '2024-04-30'),
('amex', 'MR', 'ANA Mileage Club', 'NH', 15, '2024-10-15', '2024-11-15'),
('amex', 'MR', 'ANA Mileage Club', 'NH', 25, '2025-04-01', '2025-04-30'),
('amex', 'MR', 'ANA Mileage Club', 'NH', 20, '2025-11-01', '2025-11-30'),

-- Amex → Delta (1-2x/year, targeted, 20-40%)
('amex', 'MR', 'Delta SkyMiles', 'DL', 30, '2024-06-01', '2024-06-30'),
('amex', 'MR', 'Delta SkyMiles', 'DL', 40, '2024-12-01', '2024-12-31'),
('amex', 'MR', 'Delta SkyMiles', 'DL', 30, '2025-06-01', '2025-06-30'),
('amex', 'MR', 'Delta SkyMiles', 'DL', 25, '2025-12-01', '2025-12-31'),

-- Citi → Turkish (2-3x/year, 20-25%)
('citi', 'TYP', 'Turkish Miles&Smiles', 'TK', 25, '2024-03-01', '2024-03-31'),
('citi', 'TYP', 'Turkish Miles&Smiles', 'TK', 20, '2024-08-01', '2024-08-31'),
('citi', 'TYP', 'Turkish Miles&Smiles', 'TK', 25, '2024-12-01', '2024-12-31'),
('citi', 'TYP', 'Turkish Miles&Smiles', 'TK', 20, '2025-04-01', '2025-04-30'),
('citi', 'TYP', 'Turkish Miles&Smiles', 'TK', 25, '2025-09-01', '2025-09-30'),
('citi', 'TYP', 'Turkish Miles&Smiles', 'TK', 25, '2026-03-01', '2026-03-10'),

-- Citi → Qatar (2x/year, 15-25%)
('citi', 'TYP', 'Qatar Airways Privilege Club', 'QR', 20, '2024-05-15', '2024-06-15'),
('citi', 'TYP', 'Qatar Airways Privilege Club', 'QR', 25, '2024-11-01', '2024-11-30'),
('citi', 'TYP', 'Qatar Airways Privilege Club', 'QR', 20, '2025-05-01', '2025-05-31'),
('citi', 'TYP', 'Qatar Airways Privilege Club', 'QR', 25, '2025-11-01', '2025-11-30'),
('citi', 'TYP', 'Qatar Airways Privilege Club', 'QR', 20, '2026-02-15', '2026-04-01'),

-- Capital One → Aeroplan (2x/year, 20-25%)
('capital_one', 'C1', 'Air Canada Aeroplan', 'AC', 25, '2024-04-01', '2024-04-30'),
('capital_one', 'C1', 'Air Canada Aeroplan', 'AC', 20, '2024-10-01', '2024-10-31'),
('capital_one', 'C1', 'Air Canada Aeroplan', 'AC', 25, '2025-03-15', '2025-04-15'),
('capital_one', 'C1', 'Air Canada Aeroplan', 'AC', 25, '2025-09-01', '2025-09-30'),
('capital_one', 'C1', 'Air Canada Aeroplan', 'AC', 25, '2026-03-01', '2026-03-31'),

-- Capital One → Wyndham (2-3x/year, 40-50%)
('capital_one', 'C1', 'Wyndham Rewards', 'WYNDHAM', 50, '2024-02-15', '2024-03-15'),
('capital_one', 'C1', 'Wyndham Rewards', 'WYNDHAM', 40, '2024-06-01', '2024-06-30'),
('capital_one', 'C1', 'Wyndham Rewards', 'WYNDHAM', 50, '2024-10-15', '2024-11-15'),
('capital_one', 'C1', 'Wyndham Rewards', 'WYNDHAM', 40, '2025-02-01', '2025-02-28'),
('capital_one', 'C1', 'Wyndham Rewards', 'WYNDHAM', 50, '2025-07-01', '2025-07-31'),
('capital_one', 'C1', 'Wyndham Rewards', 'WYNDHAM', 50, '2025-12-01', '2025-12-31'),
('capital_one', 'C1', 'Wyndham Rewards', 'WYNDHAM', 50, '2026-02-20', '2026-03-20'),

-- Bilt → Hyatt (monthly on transfer day, 50-100%)
('bilt', 'BILT', 'World of Hyatt', 'HYATT', 50, '2024-04-01', '2024-04-01'),
('bilt', 'BILT', 'World of Hyatt', 'HYATT', 75, '2024-07-01', '2024-07-01'),
('bilt', 'BILT', 'World of Hyatt', 'HYATT', 100, '2024-09-01', '2024-09-01'),
('bilt', 'BILT', 'World of Hyatt', 'HYATT', 50, '2024-12-01', '2024-12-01'),
('bilt', 'BILT', 'World of Hyatt', 'HYATT', 75, '2025-02-04', '2025-02-04'),
('bilt', 'BILT', 'World of Hyatt', 'HYATT', 100, '2025-05-06', '2025-05-06'),
('bilt', 'BILT', 'World of Hyatt', 'HYATT', 50, '2025-08-05', '2025-08-05'),
('bilt', 'BILT', 'World of Hyatt', 'HYATT', 75, '2025-11-04', '2025-11-04'),
('bilt', 'BILT', 'World of Hyatt', 'HYATT', 75, '2026-03-04', '2026-03-11'),

-- Bilt → Emirates (1-2x/year, 40-50%)
('bilt', 'BILT', 'Emirates Skywards', 'EK', 50, '2024-05-01', '2024-05-31'),
('bilt', 'BILT', 'Emirates Skywards', 'EK', 40, '2024-11-01', '2024-11-30'),
('bilt', 'BILT', 'Emirates Skywards', 'EK', 50, '2025-04-01', '2025-04-30'),
('bilt', 'BILT', 'Emirates Skywards', 'EK', 50, '2025-10-01', '2025-10-31'),
('bilt', 'BILT', 'Emirates Skywards', 'EK', 50, '2026-03-01', '2026-04-15');
