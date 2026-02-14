Book-trip function

POST / - create a booking for a trip. Body: { trip_id, diver_id, booking_notes }
Uses service-role key to check capacity and insert booking, placing user on waitlist if full.
