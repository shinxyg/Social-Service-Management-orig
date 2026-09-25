-- =========================================================
-- MIGRATION: Consolidate livelihood_assistance and livelihood_monitoring
-- into livelihood_applications table and drop old tables
-- =========================================================

-- 1. Ensure columns exist on livelihood_applications
ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS requested_materials JSONB DEFAULT '[]'::jsonb;
ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS requested_equipment JSONB DEFAULT '[]'::jsonb;
ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS assistance JSONB DEFAULT '{}'::jsonb;
ALTER TABLE livelihood_applications ADD COLUMN IF NOT EXISTS monitoring JSONB DEFAULT '[]'::jsonb;

DO $$
BEGIN
  -- 2. Migrate existing livelihood_assistance records into livelihood_applications
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'livelihood_assistance') THEN
    UPDATE livelihood_applications la
    SET assistance = jsonb_build_object(
      'id', COALESCE(las.id::text, 'ASST-' || la.id::text),
      'application_id', la.id,
      'reference_number', la.reference_number,
      'assistance_status', COALESCE(las.assistance_status, 'for_processing'),
      'approved_financial_amount', COALESCE(las.approved_financial_amount, 0),
      'approved_materials', CASE WHEN las.approved_materials IS NOT NULL THEN las.approved_materials ELSE '[]'::jsonb END,
      'approved_equipment', CASE WHEN las.approved_equipment IS NOT NULL THEN las.approved_equipment ELSE '[]'::jsonb END,
      'release_date', las.release_date,
      'release_time', las.release_time,
      'release_location', COALESCE(las.release_location, 'Quezon City Hall - SSDD Livelihood Center'),
      'instructions', las.instructions,
      'released_at', las.released_at,
      'released_by', las.released_by,
      'created_at', las.created_at,
      'updated_at', las.updated_at
    )
    FROM livelihood_assistance las
    WHERE las.application_id = la.id OR las.reference_number = la.reference_number;

    DROP TABLE IF EXISTS livelihood_assistance CASCADE;
  END IF;

  -- 3. Migrate existing livelihood_monitoring records into livelihood_applications
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'livelihood_monitoring') THEN
    UPDATE livelihood_applications la
    SET monitoring = COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', lm.id,
          'application_id', la.id,
          'reference_number', la.reference_number,
          'monitoring_status', COALESCE(lm.monitoring_status, 'active'),
          'log_type', COALESCE(lm.log_type, 'inspection'),
          'title', lm.title,
          'notes', lm.notes,
          'monthly_sales_range', lm.monthly_sales_range,
          'challenges_needs', lm.challenges_needs,
          'officer_name', lm.officer_name,
          'photos', CASE WHEN lm.photos IS NOT NULL THEN lm.photos ELSE '[]'::jsonb END,
          'inspection_date', lm.inspection_date,
          'created_at', lm.created_at
        ) ORDER BY lm.created_at DESC
      )
      FROM livelihood_monitoring lm
      WHERE lm.application_id = la.id OR lm.reference_number = la.reference_number
    ), '[]'::jsonb);

    DROP TABLE IF EXISTS livelihood_monitoring CASCADE;
  END IF;
END $$;
