-- Ejecuta este archivo en Supabase SQL Editor si vas a usar una clave publica
-- en SUPABASE_KEY. Esto permite que la API del proyecto suba archivos y lea
-- datos usando el rol anon.
--
-- Opcion recomendada:
-- usar SUPABASE_SERVICE_ROLE_KEY en backend/.env. Esa clave debe vivir solo en
-- el backend y evita depender de estas politicas para la insercion desde servidor.

-- Asegura que el bucket exista.
INSERT INTO storage.buckets (id, name, public)
VALUES ('conversations', 'conversations', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Limpia politicas previas para que este script pueda ejecutarse varias veces.
DROP POLICY IF EXISTS "Allow conversation uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow conversation reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads insert" ON public.uploads;
DROP POLICY IF EXISTS "Allow uploads read" ON public.uploads;
DROP POLICY IF EXISTS "Allow uploads status update" ON public.uploads;
DROP POLICY IF EXISTS "Allow faqs insert" ON public.faqs;
DROP POLICY IF EXISTS "Allow faqs read" ON public.faqs;
DROP POLICY IF EXISTS "Allow faqs update" ON public.faqs;

-- Storage: permitir subir y leer archivos del bucket conversations.
CREATE POLICY "Allow conversation uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'conversations');

CREATE POLICY "Allow conversation reads"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'conversations');

-- Tabla uploads: permitir operaciones usadas por la API.
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow uploads insert"
ON public.uploads
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow uploads read"
ON public.uploads
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow uploads status update"
ON public.uploads
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Tabla faqs: permitir operaciones usadas por la API.
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow faqs insert"
ON public.faqs
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow faqs read"
ON public.faqs
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow faqs update"
ON public.faqs
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
