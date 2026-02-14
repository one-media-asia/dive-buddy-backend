-- Create bookings_per_day RPC: returns one row per day for the last `days` days
CREATE OR REPLACE FUNCTION public.bookings_per_day(days integer) RETURNS TABLE(day date, count bigint) AS $$
SELECT d::date as day,
    COALESCE(b.cnt, 0) as count
FROM generate_series(
        (current_date - (days - 1) * INTERVAL '1 day')::date,
        current_date::date,
        INTERVAL '1 day'
    ) AS d
    LEFT JOIN (
        SELECT date_trunc('day', created_at)::date AS dt,
            count(*) AS cnt
        FROM public.bookings
        GROUP BY dt
    ) b ON b.dt = d::date
ORDER BY day;
$$ LANGUAGE sql STABLE;
-- Create pos_top_items RPC: aggregate line_items JSONB for top-selling items
CREATE OR REPLACE FUNCTION public.pos_top_items(days integer, limit_val integer) RETURNS TABLE(item text, quantity bigint, revenue numeric) AS $$
SELECT item,
    SUM(qty) AS quantity,
    SUM(qty * price) AS revenue
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
LIMIT limit_val;
$$ LANGUAGE sql STABLE;