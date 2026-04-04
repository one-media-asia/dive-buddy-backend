// API client backed by Supabase
import { supabase } from "@/integrations/supabase/client";

function throwOnError<T>({ data, error }: { data: T; error: any }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export const apiClient = {
  groups: {
    list: async () => [] as any[],
    create: async (_payload: any) => ({}),
    addMember: async (_groupId: string, _payload: any) => ({}),
    removeMember: async (_groupId: string, _memberId: string) => ({}),
  },

  divers: {
    list: async () => throwOnError(await supabase.from("divers").select("*").order("created_at", { ascending: false })),
    get: async (id: string) => throwOnError(await supabase.from("divers").select("*").eq("id", id).single()),
    create: async (payload: any) => throwOnError(await supabase.from("divers").insert({
      name: payload.name,
      email: payload.email || null,
      certification: payload.certification_level || null,
      skill_level: payload.skill_level || "beginner",
    }).select().single()),
    update: async (id: string, payload: any) => throwOnError(await supabase.from("divers").update({
      name: payload.name,
      email: payload.email || null,
      certification: payload.certification_level || null,
    }).eq("id", id).select().single()),
    delete: async (id: string) => throwOnError(await supabase.from("divers").delete().eq("id", id)),
    completeOnboarding: async (_id: string) => ({}),
  },

  courses: {
    list: async () => throwOnError(await supabase.from("courses").select("*, instructors(name), boats(name)").order("created_at", { ascending: false })),
    create: async (payload: any) => throwOnError(await supabase.from("courses").insert({
      name: payload.name,
      description: payload.description || null,
      instructor_id: payload.instructor_id || null,
      boat_id: payload.boat_id || null,
      start_date: payload.start_date || null,
      end_date: payload.end_date || null,
      max_students: payload.max_students || 6,
      price: payload.price || 0,
    }).select().single()),
    delete: async (id: string) => throwOnError(await supabase.from("courses").delete().eq("id", id)),
  },

  instructors: {
    list: async () => throwOnError(await supabase.from("instructors").select("*").order("created_at", { ascending: false })),
    create: async (payload: any) => throwOnError(await supabase.from("instructors").insert(payload).select().single()),
  },

  boats: {
    list: async () => throwOnError(await supabase.from("boats").select("*").order("created_at", { ascending: false })),
    create: async (payload: any) => throwOnError(await supabase.from("boats").insert(payload).select().single()),
  },

  accommodations: {
    list: async () => throwOnError(await supabase.from("accommodations").select("*").order("price_per_night", { ascending: true })),
    create: async (payload: any) => throwOnError(await supabase.from("accommodations").insert(payload).select().single()),
  },

  bookings: {
    list: async () => throwOnError(await supabase.from("bookings").select("*, divers(name), courses(name, price), accommodations(name, price_per_night, tier)").order("created_at", { ascending: false })),
    create: async (payload: any) => throwOnError(await supabase.from("bookings").insert({
      diver_id: payload.diver_id,
      course_id: payload.course_id || null,
      accommodation_id: payload.accommodation_id || null,
      check_in: payload.check_in || null,
      check_out: payload.check_out || null,
      total_amount: payload.total_amount || 0,
      notes: payload.notes || null,
    }).select().single()),
    update: async (id: string, payload: any) => throwOnError(await supabase.from("bookings").update(payload).eq("id", id).select().single()),
    delete: async (id: string) => throwOnError(await supabase.from("bookings").delete().eq("id", id)),
    getLast30Days: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data } = await supabase.from("bookings").select("total_amount").gte("created_at", thirtyDaysAgo.toISOString());
      const rows = data || [];
      return {
        booking_count: rows.length,
        total_revenue: rows.reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0),
        total_amount: rows.reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0),
      };
    },
    updateStatus: async (id: string, status: string) => throwOnError(await supabase.from("bookings").update({ payment_status: status }).eq("id", id)),
  },

  waivers: {
    list: async () => [] as any[],
    get: async (_diverID: string) => null,
    create: async (_payload: any) => ({}),
  },

  diveSites: {
    list: async () => throwOnError(await supabase.from("dive_sites").select("*").order("created_at", { ascending: false })),
    create: async (payload: any) => throwOnError(await supabase.from("dive_sites").insert(payload).select().single()),
    delete: async (id: string) => throwOnError(await supabase.from("dive_sites").delete().eq("id", id)),
  },

  groupItinerary: {
    get: async (_groupId: string) => [] as any[],
    updateDay: async (_groupId: string, _payload: any) => ({}),
  },

  equipment: {
    list: async () => [] as any[],
    get: async (_id: string) => null,
    create: async (_payload: any) => ({}),
    update: async (_id: string, _payload: any) => ({}),
    delete: async (_id: string) => ({}),
  },

  transactions: {
    list: async () => [] as any[],
    get: async (_id: string) => null,
    create: async (_payload: any) => ({}),
  },

  payments: {
    list: async () => [] as any[],
    create: async (_payload: any) => ({}),
  },

  pos: {
    getSummary: async () => ({ total_revenue: 0, total_transactions: 0 }),
  },
};
