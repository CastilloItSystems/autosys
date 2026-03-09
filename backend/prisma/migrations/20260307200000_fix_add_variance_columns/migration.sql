-- Ensure variance and snapshotQuantity columns exist in movements table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movements' AND column_name = 'snapshotQuantity'
  ) THEN
    ALTER TABLE "movements" ADD COLUMN "snapshotQuantity" INTEGER;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movements' AND column_name = 'variance'
  ) THEN
    ALTER TABLE "movements" ADD COLUMN "variance" INTEGER;
  END IF;
END $$;
