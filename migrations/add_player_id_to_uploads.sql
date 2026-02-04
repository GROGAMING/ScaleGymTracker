-- Add player_id column to uploads table to link uploads to players
ALTER TABLE public.uploads ADD COLUMN IF NOT EXISTS player_id uuid NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_uploads_player_id ON public.uploads(player_id);

-- Add foreign key constraint (optional but recommended)
-- This ensures player_id references a valid player
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uploads_player_id_fkey' 
        AND table_name = 'uploads'
    ) THEN
        ALTER TABLE public.uploads 
        ADD CONSTRAINT uploads_player_id_fkey 
        FOREIGN KEY (player_id) REFERENCES public.players(id) ON DELETE SET NULL;
    END IF;
END $$;
