-- Migration: remove overly-restrictive CHECK constraints on step name columns.
-- These constraints were not defined in the SQLAlchemy models and block new
-- pipeline steps added to the application.  Application-layer validation
-- is sufficient; the DB constraints add no safety value.
--
-- Run this in the Supabase SQL editor (or psql).

BEGIN;

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_current_step_check;

ALTER TABLE pipeline_states
  DROP CONSTRAINT IF EXISTS pipeline_states_step_name_check;

COMMIT;
