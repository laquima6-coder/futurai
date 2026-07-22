-- futurAI Database Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fwovflsaghnutysjyaus/sql/new

CREATE TABLE IF NOT EXISTS futurai_perfiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text, apellido text, universidad text, carrera text,
  anio_cursada int, avatar_url text, plan text DEFAULT 'free',
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS futurai_carpetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL, color text DEFAULT '#6366f1', icono text DEFAULT '📁',
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS futurai_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  carpeta_id uuid REFERENCES futurai_carpetas(id) ON DELETE SET NULL,
  titulo text NOT NULL DEFAULT 'Sin título', contenido text DEFAULT '',
  etiquetas text[] DEFAULT '{}', pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS futurai_flashcard_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL, descripcion text, materia text, color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS futurai_flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id uuid REFERENCES futurai_flashcard_sets(id) ON DELETE CASCADE,
  pregunta text NOT NULL, respuesta text NOT NULL,
  dificultad int DEFAULT 0, veces_vista int DEFAULT 0,
  ultima_vez timestamptz, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS futurai_materias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL, color text DEFAULT '#6366f1', profesor text, aula text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS futurai_notas_materia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_id uuid REFERENCES futurai_materias(id) ON DELETE CASCADE,
  nombre text NOT NULL, nota numeric(5,2), peso numeric(5,2) DEFAULT 100,
  tipo text DEFAULT 'parcial', fecha date, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS futurai_horarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_id uuid REFERENCES futurai_materias(id) ON DELETE CASCADE,
  dia_semana int NOT NULL, hora_inicio time NOT NULL, hora_fin time NOT NULL,
  aula text, tipo text DEFAULT 'clase', created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS futurai_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL, descripcion text,
  fecha_inicio timestamptz NOT NULL, fecha_fin timestamptz,
  color text DEFAULT '#6366f1', tipo text DEFAULT 'evento',
  materia_id uuid REFERENCES futurai_materias(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS futurai_recordatorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL, descripcion text, fecha timestamptz NOT NULL,
  completado boolean DEFAULT false, prioridad text DEFAULT 'media',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE futurai_perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE futurai_carpetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE futurai_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE futurai_flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE futurai_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE futurai_materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE futurai_notas_materia ENABLE ROW LEVEL SECURITY;
ALTER TABLE futurai_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE futurai_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE futurai_recordatorios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "own" ON futurai_perfiles USING (id = auth.uid()) WITH CHECK (id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own" ON futurai_carpetas USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own" ON futurai_notas USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own" ON futurai_flashcard_sets USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own" ON futurai_flashcards USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own" ON futurai_materias USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own" ON futurai_notas_materia USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own" ON futurai_horarios USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own" ON futurai_eventos USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "own" ON futurai_recordatorios USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Storage bucket for file library
INSERT INTO storage.buckets (id, name, public) VALUES ('futurai-files', 'futurai-files', false) ON CONFLICT DO NOTHING;
DO $$ BEGIN CREATE POLICY "own_files" ON storage.objects FOR ALL USING (bucket_id = 'futurai-files' AND auth.uid()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'futurai-files' AND auth.uid()::text = (storage.foldername(name))[1]); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
