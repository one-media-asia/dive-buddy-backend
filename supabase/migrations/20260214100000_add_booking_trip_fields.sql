-- Add booking status enum and trip relation/fields
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'booking_status'
) THEN CREATE TYPE public.booking_status AS ENUM ('confirmed', 'waitlist', 'cancelled');
END IF;
END $$;
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id) ON DELETE
SET NULL,
    ADD COLUMN IF NOT EXISTS seat_number INTEGER,
    ADD COLUMN IF NOT EXISTS waitlist_position INTEGER,
    ADD COLUMN IF NOT EXISTS status public.booking_status NOT NULL DEFAULT 'confirmed';
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- Ensure queries on trip capacity are fast
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON public.bookings (trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status);