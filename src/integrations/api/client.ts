// API client backed by Supabase
import { supabase } from "@/integrations/supabase/client";

function throwOnError<T>({ data, error }: { data: T; error: any }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export const apiClient = {
  groups: {
    list: async () => {
      const { data: groups, error } = await (supabase as any).from("groups")
        .select("*, leader:divers!groups_leader_id_fkey(id, name), course:courses(id, name, price)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);

      // Fetch members for each group
      const groupIds = (groups || []).map((g: any) => g.id);
      let members: any[] = [];
      if (groupIds.length > 0) {
        const { data: m } = await (supabase as any).from("group_members")
          .select("*, diver:divers(id, name)")
          .in("group_id", groupIds);
        members = m || [];
      }

      return (groups || []).map((g: any) => ({
        ...g,
        members: members.filter((m: any) => m.group_id === g.id),
      }));
    },
    create: async (payload: any) => throwOnError(await (supabase as any).from("groups").insert({
      name: payload.name,
      type: payload.type || 'fundive',
      leader_id: payload.leader_id || null,
      course_id: payload.course_id || null,
      days: payload.days || null,
      description: payload.description || null,
    }).select().single()),
    addMember: async (groupId: string, payload: any) => throwOnError(await (supabase as any).from("group_members").insert({
      group_id: groupId,
      diver_id: payload.diver_id,
      role: payload.role || null,
    }).select().single()),
    removeMember: async (_groupId: string, memberId: string) => throwOnError(await (supabase as any).from("group_members").delete().eq("id", memberId)),
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
    list: async () => {
      // Get all divers, then check which have signed waivers
      const { data: divers } = await supabase.from("divers").select("id, name, email");
      const { data: waivers } = await (supabase as any).from("waivers").select("*");
      const waiverMap = new Map((waivers || []).map((w: any) => [w.diver_id, w]));

      return (divers || []).map((d: any) => {
        const w = waiverMap.get(d.id);
        return {
          id: w?.id || d.id,
          diver_id: d.id,
          diver_name: d.name,
          diver_email: d.email,
          status: w ? 'signed' : 'pending',
          signed_at: w?.signed_at || null,
          signature_data: w?.signature_data || null,
          created_at: w?.created_at || d.created_at,
        };
      });
    },
    get: async (diverId: string) => {
      const { data } = await (supabase as any).from("waivers").select("*").eq("diver_id", diverId).maybeSingle();
      return data;
    },
    create: async (payload: any) => throwOnError(await (supabase as any).from("waivers").insert({
      diver_id: payload.diver_id,
      status: 'signed',
      signature_data: payload.signature_data,
      signed_at: new Date().toISOString(),
      notes: payload.notes || null,
    }).select().single()),
  },

  diveSites: {
    list: async () => throwOnError(await supabase.from("dive_sites").select("*").order("created_at", { ascending: false })),
    create: async (payload: any) => throwOnError(await supabase.from("dive_sites").insert(payload).select().single()),
    delete: async (id: string) => throwOnError(await supabase.from("dive_sites").delete().eq("id", id)),
  },

  groupItinerary: {
    get: async (groupId: string) => {
      const { data, error } = await (supabase as any).from("group_itinerary")
        .select("*, dive_sites(name, location, max_depth, difficulty)")
        .eq("group_id", groupId)
        .order("day_number", { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []).map((item: any) => ({
        ...item,
        site_name: item.dive_sites?.name || null,
        location: item.dive_sites?.location || null,
        max_depth: item.dive_sites?.max_depth || null,
        difficulty: item.dive_sites?.difficulty || null,
      }));
    },
    updateDay: async (groupId: string, payload: any) => {
      // Upsert: insert or update based on group_id + day_number
      const { data: existing } = await (supabase as any).from("group_itinerary")
        .select("id")
        .eq("group_id", groupId)
        .eq("day_number", payload.day_number)
        .maybeSingle();

      if (existing) {
        return throwOnError(await (supabase as any).from("group_itinerary")
          .update({ dive_site_id: payload.dive_site_id })
          .eq("id", existing.id)
          .select().single());
      } else {
        return throwOnError(await (supabase as any).from("group_itinerary").insert({
          group_id: groupId,
          day_number: payload.day_number,
          dive_site_id: payload.dive_site_id,
        }).select().single());
      }
    },
  },

  equipment: {
    list: async () => {
      const { data, error } = await (supabase as any).from("equipment").select("*").order("created_at", { ascending: false });
      return { data: data || [], error };
    },
    get: async (id: string) => throwOnError(await (supabase as any).from("equipment").select("*").eq("id", id).single()),
    create: async (payload: any) => throwOnError(await (supabase as any).from("equipment").insert(payload).select().single()),
    update: async (id: string, payload: any) => throwOnError(await (supabase as any).from("equipment").update(payload).eq("id", id).select().single()),
    delete: async (id: string) => throwOnError(await (supabase as any).from("equipment").delete().eq("id", id)),
  },

  transactions: {
    list: async () => throwOnError(await (supabase as any).from("transactions").select("*, equipment(name), divers(name)").order("created_at", { ascending: false })),
    get: async (id: string) => throwOnError(await (supabase as any).from("transactions").select("*").eq("id", id).single()),
    create: async (payload: any) => throwOnError(await (supabase as any).from("transactions").insert(payload).select().single()),
  },

  payments: {
    list: async () => throwOnError(await (supabase as any).from("payments").select("*, bookings(diver_id, divers(name))").order("created_at", { ascending: false })),
    create: async (payload: any) => throwOnError(await (supabase as any).from("payments").insert(payload).select().single()),
  },

  pos: {
    getSummary: async () => {
      const { data: txns } = await (supabase as any).from("transactions").select("total_price");
      const rows = txns || [];
      return {
        total_revenue: rows.reduce((sum: number, t: any) => sum + Number(t.total_price || 0), 0),
        total_transactions: rows.length,
      };
    },
  },
};
