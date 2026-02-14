-- Materialized metrics tables and refresh function
-- Bookings per day materialized table
CREATE TABLE IF NOT EXISTS public.metrics_bookings_day (
    day date PRIMARY KEY,
    count bigint NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Revenue per day materialized table
CREATE TABLE IF NOT EXISTS public.metrics_revenue_day (
    day date PRIMARY KEY,
    revenue numeric NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Top items materialized table
CREATE TABLE IF NOT EXISTS public.metrics_top_items (
    item text PRIMARY KEY,
    quantity bigint NOT NULL DEFAULT 0,
    revenue numeric NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Refresh function that repopulates the materialized tables
CREATE OR REPLACE FUNCTION public.refresh_all_metrics(days integer DEFAULT 30) RETURNS void LANGUAGE plpgsql AS $$ BEGIN -- Refresh bookings per day for last `days` days
DELETE FROM public.metrics_bookings_day
WHERE day >= (current_date - (days - 1) * INTERVAL '1 day')::date;
INSERT INTO public.metrics_bookings_day (day, count, updated_at)
SELECT d::date as day,
    COALESCE(b.cnt, 0) as count,
    now()
FROM generate_series(
        (current_date - (days - 1) * INTERVAL '1 day')::date,
        current_date::date,
        INTERVAL '1 day'
    ) AS d
    LEFT JOIN (
        SELECT date_trunc('day', created_at)::date AS dt,
            count(*) AS cnt
        FROM public.bookings
        WHERE created_at >= (current_date - (days - 1) * INTERVAL '1 day')
        GROUP BY dt
    ) b ON b.dt = d::date ON CONFLICT (day) DO
UPDATE
SET count = EXCLUDED.count,
    updated_at = EXCLUDED.updated_at;
-- Refresh revenue per day
DELETE FROM public.metrics_revenue_day
WHERE day >= (current_date - (days - 1) * INTERVAL '1 day')::date;
INSERT INTO public.metrics_revenue_day (day, revenue, updated_at)
SELECT d::date as day,
    COALESCE(r.rev, 0) as revenue,
    now()
FROM generate_series(
        (current_date - (days - 1) * INTERVAL '1 day')::date,
        current_date::date,
        INTERVAL '1 day'
    ) AS d
    LEFT JOIN (
        SELECT date_trunc('day', created_at)::date AS dt,
            SUM(amount) AS rev
        FROM public.pos_transactions
        WHERE created_at >= (current_date - (days - 1) * INTERVAL '1 day')
            AND status = 'paid'
        GROUP BY dt
    ) r ON r.dt = d::date ON CONFLICT (day) DO
UPDATE
SET revenue = EXCLUDED.revenue,
    updated_at = EXCLUDED.updated_at;
-- Refresh top items (last `days` days) - top 100
DELETE FROM public.metrics_top_items;
INSERT INTO public.metrics_top_items (item, quantity, revenue, updated_at)
SELECT item,
    SUM(qty) AS quantity,
    SUM(qty * price) AS revenue,
    now()
FROM (
        SELECT (elem->>'name') AS item,
            COALESCE((elem->>'quantity')::int, 1) AS qty,
            COALESCE((elem->>'price')::numeric, 0) AS price
        FROM public.pos_transactions,
            jsonb_array_elements(line_items) elem
        WHERE created_at >= now() - (days || ' days')::interval
            AND status = 'paid'
    ) s
GROUP BY item
ORDER BY quantity DESC
LIMIT 100 ON CONFLICT (item) DO
UPDATE
SET quantity = EXCLUDED.quantity,
    revenue = EXCLUDED.revenue,
    updated_at = EXCLUDED.updated_at;
END;
$$;