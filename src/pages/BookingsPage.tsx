import { useState, useEffect } from "react";
import { z } from "zod";
import { Plus, Trash2, Edit2, FileText, Download, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";
import { generateInvoicePDF, printInvoice } from "@/utils/invoiceGenerator";
import { equipment, rentalAssignments } from "@/hooks/usePOS";

const PAYMENT_STATUSES = ["unpaid", "partial", "paid", "refunded"] as const;
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Accepts empty string or an ISO-ish YYYY-MM-DD date. Empty string means "no date".
const dateOrEmpty = z
  .string()
  .refine((v) => v === "" || !Number.isNaN(new Date(v).getTime()), {
    message: "Invalid date",
  });

const bookingSchema = z
  .object({
    booking_type: z.enum(["course", "fun_dive"]),
    diver_id: z.string().uuid({ message: "Diver is required" }),
    group_id: z.string().uuid().or(z.literal("")),
    course_id: z.string().uuid().or(z.literal("")),
    accommodation_id: z.string().uuid().or(z.literal("")),
    check_in: dateOrEmpty,
    check_out: dateOrEmpty,
    payment_status: z.enum(PAYMENT_STATUSES),
    notes: z.string().max(500, { message: "Notes must be under 500 characters" }),
  })
  .superRefine((val, ctx) => {
    if (val.booking_type === "course" && !val.course_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["course_id"],
        message: "Course is required for a course booking",
      });
    }
    if (val.booking_type === "fun_dive" && !val.group_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["group_id"],
        message: "Group is required for a fun dive booking",
      });
    }
    if (val.check_in && val.check_out) {
      if (new Date(val.check_out).getTime() < new Date(val.check_in).getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["check_out"],
          message: "Check-out must be on or after check-in",
        });
      }
    }
    if ((val.check_in && !val.check_out) || (!val.check_in && val.check_out)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["check_out"],
        message: "Provide both check-in and check-out, or neither",
      });
    }
    if (val.accommodation_id && (!val.check_in || !val.check_out)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["check_in"],
        message: "Accommodation requires check-in and check-out dates",
      });
    }
  });

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [divers, setDivers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [stats, setStats] = useState({ booking_count: 0, total_revenue: 0, total_amount: 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ booking_type: "course", diver_id: "", group_id: "", course_id: "", accommodation_id: "", check_in: "", check_out: "", payment_status: "unpaid", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Array<{ equipment_id: string; quantity: number }>>([]);
  const [rentalAssignmentsList, setRentalAssignmentsList] = useState<any[]>([]);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [b, d, g, c, a, s, e] = await Promise.all([
        apiClient.bookings.list(),
        apiClient.divers.list(),
        apiClient.groups.list(),
        apiClient.courses.list(),
        apiClient.accommodations.list(),
        apiClient.bookings.getLast30Days(),
        equipment.list(),
      ]);
      setBookings(b);
      setDivers(d);
      setGroups(g);
      setCourses(c);
      setAccommodations(a);
      setStats(s);
      setEquipmentList(e.data || []);
    } catch (err) {
      console.error('Failed to load bookings', err);
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const calcTotal = () => {
    let total = 0;
    const course = courses.find((c) => c.id === form.course_id);
    if (course) total += Number(course.price);
    const acc = accommodations.find((a) => a.id === form.accommodation_id);
    if (acc && form.check_in && form.check_out) {
      const nights = Math.max(1, Math.ceil((new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / 86400000));
      total += Number(acc.price_per_night) * nights;
    }
    return total;
  };

  const handleOpenForm = (booking?: any) => {
    if (booking) {
      setEditingId(booking.id);
      setForm({
        booking_type: booking.group_id ? "fun_dive" : "course",
        diver_id: booking.diver_id,
        group_id: booking.group_id || "",
        course_id: booking.course_id || "",
        accommodation_id: booking.accommodation_id || "",
        check_in: booking.check_in || "",
        check_out: booking.check_out || "",
        payment_status: booking.payment_status || "unpaid",
        notes: booking.notes || "",
      });
      loadRentalAssignments(booking.id);
    } else {
      setEditingId(null);
      setForm({ booking_type: "course", diver_id: "", group_id: "", course_id: "", accommodation_id: "", check_in: "", check_out: "", payment_status: "unpaid", notes: "" });
      setSelectedEquipment([]);
      setRentalAssignmentsList([]);
    }
    setOpen(true);
  };

  const loadRentalAssignments = async (bookingId: string) => {
    try {
      const { data } = await rentalAssignments.list(bookingId);
      setRentalAssignmentsList(data || []);
    } catch (err) {
      console.error('Failed to load rental assignments', err);
    }
  };

  const handleSubmit = async () => {
    const parsed = bookingSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast({
        title: "Please fix the highlighted fields",
        description: Object.values(fieldErrors)[0],
        variant: "destructive",
      });
      return;
    }
    setErrors({});
    const values = parsed.data;
    const total = calcTotal();
    setSubmitting(true);
    try {
      let bookingId = editingId;

      const payload = {
        diver_id: values.diver_id,
        course_id: values.booking_type === "course" ? values.course_id || null : null,
        group_id: values.booking_type === "fun_dive" ? values.group_id || null : null,
        accommodation_id: values.accommodation_id || null,
        check_in: values.check_in || null,
        check_out: values.check_out || null,
        total_amount: total,
        notes: values.notes || null,
      };

      if (editingId) {
        await apiClient.bookings.update(editingId, {
          ...payload,
          payment_status: values.payment_status,
        });
        toast({ title: "Success", description: "Booking updated successfully" });
      } else {
        const res = await apiClient.bookings.create(payload);
        bookingId = res.id;
        toast({ title: "Success", description: "Booking created successfully" });
      }

      // Save rental assignments
      if (bookingId && selectedEquipment.length > 0) {
        for (const eq of selectedEquipment) {
          await rentalAssignments.create({
            booking_id: bookingId,
            equipment_id: eq.equipment_id,
            quantity: eq.quantity,
            check_in: values.check_in,
            check_out: values.check_out,
          });
        }
        toast({ title: "Success", description: `${selectedEquipment.length} equipment items assigned` });
      }

      setOpen(false);
      setSelectedEquipment([]);
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const updatePaymentStatus = async (id: string, next: PaymentStatus) => {
    try {
      await apiClient.bookings.update(id, { payment_status: next });
      toast({ title: "Payment status updated", description: `Marked as ${next}` });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
  };


  const calculateNights = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleInvoiceDownload = async (booking: any) => {
    try {
      const nights = calculateNights(booking.check_in, booking.check_out);
      const accommodationPrice = booking.accommodations?.price_per_night 
        ? (booking.accommodations.price_per_night * nights)
        : 0;

      const invoiceData = {
        diver: booking.divers?.name || "Unknown Diver",
        course: booking.courses?.name || "No Course",
        coursePrice: booking.courses?.price || 0,
        accommodation: booking.accommodations?.name || "No Accommodation",
        accommodationPrice: accommodationPrice,
        totalAmount: booking.total_amount,
        paymentStatus: booking.payment_status,
        invoiceNumber: booking.invoice_number || booking.id,
        dateCreated: new Date(booking.created_at).toLocaleDateString(),
        checkIn: booking.check_in || "",
        checkOut: booking.check_out || "",
      };
      generateInvoicePDF(invoiceData);
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate invoice", variant: "destructive" });
    }
  };

  const handleInvoicePrint = async (booking: any) => {
    try {
      const nights = calculateNights(booking.check_in, booking.check_out);
      const accommodationPrice = booking.accommodations?.price_per_night 
        ? (booking.accommodations.price_per_night * nights)
        : 0;

      const invoiceData = {
        diver: booking.divers?.name || "Unknown Diver",
        course: booking.courses?.name || "No Course",
        coursePrice: booking.courses?.price || 0,
        accommodation: booking.accommodations?.name || "No Accommodation",
        accommodationPrice: accommodationPrice,
        totalAmount: booking.total_amount,
        paymentStatus: booking.payment_status,
        invoiceNumber: booking.invoice_number || booking.id,
        dateCreated: new Date(booking.created_at).toLocaleDateString(),
        checkIn: booking.check_in || "",
        checkOut: booking.check_out || "",
      };
      printInvoice(invoiceData);
    } catch (err) {
      toast({ title: "Error", description: "Failed to print invoice", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    try {
      await apiClient.bookings.delete(id);
      toast({ title: "Success", description: "Booking deleted" });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
  };

  const statusColors: Record<string, string> = {
    paid: "bg-success/20 text-success border border-success/30",
    partial: "bg-warning/20 text-warning border border-warning/30",
    unpaid: "bg-destructive/20 text-destructive border border-destructive/30",
    refunded: "bg-muted text-muted-foreground border border-border",
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Bookings & Invoices</h1>
          <p className="page-description">Manage course bookings, accommodations, and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('https://drive.google.com/file/d/1PrpW7MAlWJFAepWbF7ab8SKPd1jlPnY5/view?usp=drive_link', '_blank')}>
            <Download className="h-4 w-4 mr-2" />
            Download Booking Form
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Booking" : "New Booking"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Booking Type Selector */}
              <div>
                <Label>Booking Type *</Label>
                <div className="flex gap-3 mt-2">
                  <Button
                    variant={form.booking_type === "course" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, booking_type: "course", group_id: "" })}
                    className="flex-1"
                  >
                    Course
                  </Button>
                  <Button
                    variant={form.booking_type === "fun_dive" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, booking_type: "fun_dive", course_id: "" })}
                    className="flex-1"
                  >
                    Fun Dive
                  </Button>
                </div>
              </div>

              <div>
                <Label>Diver *</Label>
                <Select value={form.diver_id} onValueChange={(v) => setForm({ ...form, diver_id: v })}>
                  <SelectTrigger aria-invalid={!!errors.diver_id}><SelectValue placeholder="Select diver" /></SelectTrigger>
                    <SelectContent className="z-50">{divers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.diver_id && <p className="text-sm text-destructive mt-1">{errors.diver_id}</p>}
              </div>

              {/* Course Selection - Only show for course bookings */}
              {form.booking_type === "course" && (
                <div>
                  <Label>Course *</Label>
                  <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                    <SelectTrigger aria-invalid={!!errors.course_id}><SelectValue placeholder="Select course" /></SelectTrigger>
                      <SelectContent className="z-50">{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} (${c.price})</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.course_id && <p className="text-sm text-destructive mt-1">{errors.course_id}</p>}
                </div>
              )}

              {/* Group Selection - Only show for fun dive bookings */}
              {form.booking_type === "fun_dive" && (
                <div>
                  <Label>Group *</Label>
                  <Select value={form.group_id} onValueChange={(v) => setForm({ ...form, group_id: v })}>
                    <SelectTrigger aria-invalid={!!errors.group_id}><SelectValue placeholder="Select group" /></SelectTrigger>
                    <SelectContent className="z-50">{groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name} ({g.days} days)</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.group_id && <p className="text-sm text-destructive mt-1">{errors.group_id}</p>}
                </div>
              )}

              <div>
                <Label>Accommodation</Label>
                <Select value={form.accommodation_id} onValueChange={(v) => setForm({ ...form, accommodation_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select accommodation (optional)" /></SelectTrigger>
                    <SelectContent className="z-50">{accommodations.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.tier === "free_with_course" ? "Free" : `$${a.price_per_night}/night`})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check In</Label>
                  <Input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} aria-invalid={!!errors.check_in} />
                  {errors.check_in && <p className="text-sm text-destructive mt-1">{errors.check_in}</p>}
                </div>
                <div>
                  <Label>Check Out</Label>
                  <Input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} aria-invalid={!!errors.check_out} min={form.check_in || undefined} />
                  {errors.check_out && <p className="text-sm text-destructive mt-1">{errors.check_out}</p>}
                </div>
              </div>
              {editingId && (
                <div>
                  <Label>Payment Status</Label>
                  <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="z-50">
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} aria-invalid={!!errors.notes} />
                {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes}</p>}
              </div>


              {/* Equipment Assignment */}
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">Equipment for Check-In</Label>
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                  {selectedEquipment.map((sel, idx) => {
                    const eq = equipmentList.find(e => e.id === sel.equipment_id);
                    return (
                      <div key={idx} className="flex items-center justify-between bg-muted/50 p-2 rounded text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{eq?.name}</p>
                          <p className="text-xs text-muted-foreground">${eq?.rent_price_per_day}/day × {sel.quantity}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEquipment(selectedEquipment.filter((_, i) => i !== idx))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Select>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add equipment..." />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {equipmentList.filter(e => e.can_rent).map((eq) => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.name} (${eq.rent_price_per_day}/day)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => {
                      const select = document.querySelector('[role="combobox"]') as HTMLElement;
                      const value = (select?.getAttribute('data-value') || '');
                      if (value && !selectedEquipment.find(s => s.equipment_id === value)) {
                        setSelectedEquipment([...selectedEquipment, { equipment_id: value, quantity: 1 }]);
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-md p-3 text-center">
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold">${calcTotal()}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>{editingId ? "Update" : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Last 30 Days Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bookings (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.booking_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (Paid)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats.total_revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${stats.total_amount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading bookings…</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr className="bg-muted/50">
                <th>Invoice #</th><th>Diver</th><th>Course</th><th>Accommodation</th><th>Dates</th><th>Total</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No bookings yet</td></tr>
              ) : bookings.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                  <td className="font-mono text-sm"><FileText className="h-3 w-3 inline mr-1" />{b.invoice_number || "—"}</td>
                  <td>{b.divers?.name || "—"}</td>
                  <td>{b.courses?.name || "—"}</td>
                  <td>{b.accommodations?.name || "—"}</td>
                  <td className="text-sm">{b.check_in || "—"} → {b.check_out || "—"}</td>
                  <td className="font-mono font-medium">${b.total_amount}</td>
                  <td>
                    <Select
                      value={b.payment_status}
                      onValueChange={(v) => updatePaymentStatus(b.id, v as PaymentStatus)}
                    >
                      <SelectTrigger
                        className={`h-8 w-[120px] capitalize ${statusColors[b.payment_status] ?? ""}`}
                        aria-label="Update payment status"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {PAYMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {b.payment_status === "paid" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleInvoiceDownload(b)} title="Download Invoice">
                            <Download className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleInvoicePrint(b)} title="Print Invoice">
                            <Printer className="h-4 w-4 text-blue-600" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleOpenForm(b)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
