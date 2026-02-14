-- Add MVP feature tables: waivers, gear, rentals, maintenance, trips, incidents, pos
-- Enums
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'gear_status'
) THEN CREATE TYPE public.gear_status AS ENUM ('available', 'rented', 'in_repair', 'retired');
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'transaction_status'
) THEN CREATE TYPE public.transaction_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
END IF;
END $$;
-- Gear catalog
CREATE TABLE IF NOT EXISTS public.gear_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT,
    description TEXT,
    purchase_date DATE,
    maintenance_interval_days INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gear_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read gear_items" ON public.gear_items FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage gear_items" ON public.gear_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Specific stock units (serial-numbered when applicable)
CREATE TABLE IF NOT EXISTS public.gear_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gear_item_id UUID REFERENCES public.gear_items(id) ON DELETE CASCADE NOT NULL,
    serial_number TEXT,
    status public.gear_status NOT NULL DEFAULT 'available',
    last_maintenance_at TIMESTAMPTZ,
    next_maintenance_due TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gear_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read gear_stock" ON public.gear_stock FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage gear_stock" ON public.gear_stock FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Rentals / reservations for gear
CREATE TABLE IF NOT EXISTS public.gear_rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE
    SET NULL,
        gear_stock_id UUID REFERENCES public.gear_stock(id) ON DELETE
    SET NULL,
        renter_id UUID REFERENCES public.divers(id) ON DELETE
    SET NULL,
        start_at TIMESTAMPTZ NOT NULL,
        end_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'reserved',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gear_rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read gear_rentals" ON public.gear_rentals FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage gear_rentals" ON public.gear_rentals FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Maintenance tasks for gear units
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gear_stock_id UUID REFERENCES public.gear_stock(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        due_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'scheduled',
        notes TEXT
);
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read maintenance_tasks" ON public.maintenance_tasks FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage maintenance_tasks" ON public.maintenance_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Trips / day-events (for scheduling trips that bookings can attach to)
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    boat_id UUID REFERENCES public.boats(id) ON DELETE
    SET NULL,
        instructor_id UUID REFERENCES public.instructors(id) ON DELETE
    SET NULL,
        start_at TIMESTAMPTZ NOT NULL,
        end_at TIMESTAMPTZ,
        capacity INTEGER NOT NULL DEFAULT 8,
        status TEXT NOT NULL DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read trips" ON public.trips FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage trips" ON public.trips FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Waivers (digital forms & signatures)
CREATE TABLE IF NOT EXISTS public.waivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diver_id UUID REFERENCES public.divers(id) ON DELETE CASCADE NOT NULL,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    signature_text TEXT,
    signature_image_url TEXT,
    signed_at TIMESTAMPTZ,
    ip_address TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.waivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read waivers" ON public.waivers FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert waivers" ON public.waivers FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can manage own waivers" ON public.waivers FOR
UPDATE TO authenticated USING (true) WITH CHECK (true);
-- Hazard Identification & Incidents
CREATE TABLE IF NOT EXISTS public.hazard_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES public.dive_sites(id) ON DELETE
    SET NULL,
        assessor_id UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        assessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        risk_level TEXT,
        hazards JSONB,
        mitigations JSONB,
        notes TEXT
);
ALTER TABLE public.hazard_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage hazard_assessments" ON public.hazard_assessments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dive_log_id UUID REFERENCES public.dive_logs(id) ON DELETE
    SET NULL,
        reported_by UUID REFERENCES public.profiles(id) ON DELETE
    SET NULL,
        reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        description TEXT NOT NULL,
        severity TEXT,
        actions_taken JSONB,
        resolved_at TIMESTAMPTZ
);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage incidents" ON public.incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- POS / transactions (linked to bookings or divers)
CREATE TABLE IF NOT EXISTS public.pos_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diver_id UUID REFERENCES public.divers(id) ON DELETE
    SET NULL,
        booking_id UUID REFERENCES public.bookings(id) ON DELETE
    SET NULL,
        amount NUMERIC NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        status public.transaction_status NOT NULL DEFAULT 'pending',
        line_items JSONB,
        external_payment_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read pos_transactions" ON public.pos_transactions FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage pos_transactions" ON public.pos_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Indexes to help common queries
CREATE INDEX IF NOT EXISTS idx_gear_stock_item ON public.gear_stock (gear_item_id);
CREATE INDEX IF NOT EXISTS idx_gear_rentals_booking ON public.gear_rentals (booking_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_gear ON public.maintenance_tasks (gear_stock_id);
CREATE INDEX IF NOT EXISTS idx_trips_boat ON public.trips (boat_id);
CREATE INDEX IF NOT EXISTS idx_waivers_diver ON public.waivers (diver_id);
CREATE INDEX IF NOT EXISTS idx_incidents_dive_log ON public.incidents (dive_log_id);
-- Done