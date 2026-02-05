-- Add player_name column to uploads table to store the player's name directly
ALTER TABLE public.uploads ADD COLUMN IF NOT EXISTS player_name text NULL;

-- Add index for performance (optional)
CREATE INDEX IF NOT EXISTS idx_uploads_player_name ON public.uploads(player_name);

-- Add a comment explaining the column
COMMENT ON COLUMN public.uploads.player_name IS 'Player name at time of upload - stored directly to avoid joins';
