# ScaleGymTracker

## Backfill player_name on uploads

To update existing uploads where player_name is null (from before player_name was stored), run this SQL in Supabase:

```sql
UPDATE uploads 
SET player_name = players.name 
FROM players 
WHERE uploads.player_id = players.id 
  AND uploads.player_name IS NULL;
```