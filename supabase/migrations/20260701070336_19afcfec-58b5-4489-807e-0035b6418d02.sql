
-- Waivers bucket: staff/admin only for all operations
DROP POLICY IF EXISTS "Staff read waivers"   ON storage.objects;
DROP POLICY IF EXISTS "Staff write waivers"  ON storage.objects;
DROP POLICY IF EXISTS "Staff update waivers" ON storage.objects;
DROP POLICY IF EXISTS "Staff delete waivers" ON storage.objects;

CREATE POLICY "Staff read waivers" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'waivers' AND private_utils.is_staff(auth.uid()));

CREATE POLICY "Staff write waivers" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'waivers' AND private_utils.is_staff(auth.uid()));

CREATE POLICY "Staff update waivers" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'waivers' AND private_utils.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'waivers' AND private_utils.is_staff(auth.uid()));

CREATE POLICY "Staff delete waivers" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'waivers' AND private_utils.has_role(auth.uid(), 'admin'));

-- Incident-attachments bucket
DROP POLICY IF EXISTS "Staff read incident-attachments"   ON storage.objects;
DROP POLICY IF EXISTS "Staff write incident-attachments"  ON storage.objects;
DROP POLICY IF EXISTS "Staff update incident-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Staff delete incident-attachments" ON storage.objects;

CREATE POLICY "Staff read incident-attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'incident-attachments' AND private_utils.is_staff(auth.uid()));

CREATE POLICY "Staff write incident-attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'incident-attachments' AND private_utils.is_staff(auth.uid()));

CREATE POLICY "Staff update incident-attachments" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'incident-attachments' AND private_utils.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'incident-attachments' AND private_utils.is_staff(auth.uid()));

CREATE POLICY "Staff delete incident-attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'incident-attachments' AND private_utils.has_role(auth.uid(), 'admin'));
