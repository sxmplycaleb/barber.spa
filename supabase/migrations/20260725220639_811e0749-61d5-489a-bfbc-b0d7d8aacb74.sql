CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category text NOT NULL DEFAULT 'Grooming',
  price_kes integer NOT NULL DEFAULT 0 CHECK (price_kes >= 0),
  duration_minutes integer NOT NULL DEFAULT 30 CHECK (duration_minutes > 0 AND duration_minutes <= 600),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active services are publicly readable"
  ON public.services FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Staff and owners can read all services"
  ON public.services FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Owners can create services"
  ON public.services FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update services"
  ON public.services FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete services"
  ON public.services FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER services_set_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX services_active_sort_idx ON public.services (is_active, sort_order);

INSERT INTO public.services (name, slug, description, category, price_kes, duration_minutes, sort_order) VALUES
  ('Signature Cut', 'signature-cut', 'A precision haircut tailored to your head shape, finished with a hot towel and styling.', 'Haircuts', 1500, 45, 1),
  ('Skin Fade', 'skin-fade', 'A seamless fade taken down to the skin, blended by hand with clipper and razor work.', 'Haircuts', 1800, 60, 2),
  ('Beard Sculpt', 'beard-sculpt', 'Shape, line-up and condition your beard with hot towels and beard oil.', 'Beard', 1000, 30, 3),
  ('Hot Towel Shave', 'hot-towel-shave', 'A traditional straight-razor shave with hot towels, pre-shave oil and balm.', 'Shaves', 1200, 45, 4),
  ('Cut & Beard Combo', 'cut-and-beard-combo', 'Our signature cut paired with a full beard sculpt — the complete reset.', 'Packages', 2200, 75, 5),
  ('Scalp Treatment', 'scalp-treatment', 'Deep-cleansing scalp therapy with massage to relieve dryness and build-up.', 'Treatments', 900, 30, 6),
  ('Kids Cut', 'kids-cut', 'A patient, comfortable cut for gentlemen under twelve.', 'Haircuts', 800, 30, 7);