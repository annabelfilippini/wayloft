-- Transfer Bonus Seed Data
-- Paste into Supabase Dashboard SQL Editor
-- Realistic bonuses for March 2026

INSERT INTO public.transfer_bonuses (bank, currency, partner, partner_code, partner_type, bonus_percentage, start_date, end_date, source_url, is_active) VALUES

-- Chase UR bonuses
('chase', 'UR', 'World of Hyatt', 'HYATT', 'hotel', 30, '2026-02-15', '2026-03-15', 'https://ultimaterewardspoints.chase.com', true),
('chase', 'UR', 'British Airways Avios', 'BA', 'airline', 25, '2026-03-01', '2026-04-15', 'https://ultimaterewardspoints.chase.com', true),

-- Amex MR bonuses
('amex', 'MR', 'Virgin Atlantic Flying Club', 'VS', 'airline', 30, '2026-02-01', '2026-03-31', 'https://global.americanexpress.com/rewards', true),
('amex', 'MR', 'Hilton Honors', 'HILTON', 'hotel', 40, '2026-03-01', '2026-04-30', 'https://global.americanexpress.com/rewards', true),

-- Citi TYP bonuses
('citi', 'TYP', 'Turkish Miles&Smiles', 'TK', 'airline', 25, '2026-03-01', '2026-03-10', 'https://www.thankyou.com', true),
('citi', 'TYP', 'Qatar Airways Privilege Club', 'QR', 'airline', 20, '2026-02-15', '2026-04-01', 'https://www.thankyou.com', true),

-- Capital One bonuses
('capital_one', 'C1', 'Air Canada Aeroplan', 'AC', 'airline', 25, '2026-03-01', '2026-03-31', 'https://www.capitalone.com/credit-cards/benefits/travel/', true),
('capital_one', 'C1', 'Wyndham Rewards', 'WYNDHAM', 'hotel', 50, '2026-02-20', '2026-03-20', 'https://www.capitalone.com/credit-cards/benefits/travel/', true),

-- Bilt bonuses
('bilt', 'BILT', 'World of Hyatt', 'HYATT', 'hotel', 75, '2026-03-04', '2026-03-11', 'https://www.biltrewards.com/transfer', true),
('bilt', 'BILT', 'Emirates Skywards', 'EK', 'airline', 50, '2026-03-01', '2026-04-15', 'https://www.biltrewards.com/transfer', true);
