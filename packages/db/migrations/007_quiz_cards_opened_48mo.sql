-- Migration 007: Add cards_opened_48mo column to card_quiz_responses
-- Supports Citi 8/48 rule checking in the recommendation engine.

ALTER TABLE card_quiz_responses
ADD COLUMN IF NOT EXISTS cards_opened_48mo integer DEFAULT 0;
