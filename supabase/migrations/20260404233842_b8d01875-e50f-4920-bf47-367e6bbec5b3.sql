
-- Groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'fundive',
  days INTEGER,
  leader_id UUID REFERENCES public.divers(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read groups" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update groups" ON public.groups FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete groups" ON public.groups FOR DELETE TO authenticated USING (true);

-- Group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  diver_id UUID NOT NULL REFERENCES public.divers(id) ON DELETE CASCADE,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, diver_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read group_members" ON public.group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert group_members" ON public.group_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update group_members" ON public.group_members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete group_members" ON public.group_members FOR DELETE TO authenticated USING (true);

-- Group itinerary table
CREATE TABLE public.group_itinerary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  dive_site_id UUID REFERENCES public.dive_sites(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, day_number)
);
ALTER TABLE public.group_itinerary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read group_itinerary" ON public.group_itinerary FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert group_itinerary" ON public.group_itinerary FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update group_itinerary" ON public.group_itinerary FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete group_itinerary" ON public.group_itinerary FOR DELETE TO authenticated USING (true);

-- Waivers table
CREATE TABLE public.waivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diver_id UUID NOT NULL REFERENCES public.divers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  signature_data TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read waivers" ON public.waivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert waivers" ON public.waivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update waivers" ON public.waivers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete waivers" ON public.waivers FOR DELETE TO authenticated USING (true);

-- Equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  rent_price_per_day NUMERIC NOT NULL DEFAULT 0,
  buy_price NUMERIC NOT NULL DEFAULT 0,
  can_rent BOOLEAN NOT NULL DEFAULT true,
  can_buy BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read equipment" ON public.equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert equipment" ON public.equipment FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update equipment" ON public.equipment FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete equipment" ON public.equipment FOR DELETE TO authenticated USING (true);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'sale',
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
  diver_id UUID REFERENCES public.divers(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read transactions" ON public.transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update transactions" ON public.transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete transactions" ON public.transactions FOR DELETE TO authenticated USING (true);

-- Payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'cash',
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update payments" ON public.payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete payments" ON public.payments FOR DELETE TO authenticated USING (true);
