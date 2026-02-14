import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [divers, setDivers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [stats, setStats] = useState({ booking_count: 0, total_revenue: 0, total_amount: 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ diver_id: "", course_id: "", accommodation_id: "", check_in: "", check_out: "", payment_status: "unpaid", notes: "" });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [b, d, c, a, s] = await Promise.all([
        apiClient.bookings.list(),
        apiClient.divers.list(),
        apiClient.courses.list(),
        apiClient.accommodations.list(),
        apiClient.bookings.getLast30Days(),
      ]);
      setBookings(b);
      setDivers(d);
      setCourses(c);
      setAccommodations(a);
      setStats(s);
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
        diver_id: booking.diver_id,
        course_id: booking.course_id || "",
        accommodation_id: booking.accommodation_id || "",
        check_in: booking.check_in || "",
        check_out: booking.check_out || "",
        payment_status: booking.payment_status || "unpaid",
        notes: booking.notes || "",
      });
    } else {
      setEditingId(null);
      setForm({ diver_id: "", course_id: "", accommodation_id: "", check_in: "", check_out: "", payment_status: "unpaid", notes: "" });
    }
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.diver_id) {
      toast({ title: "Error", description: "Diver is required", variant: "destructive" });
      return;
    }

    const total = calcTotal();
    try {
      if (editingId) {
        await apiClient.bookings.update(editingId, {
          diver_id: form.diver_id,
          course_id: form.course_id || null,
          accommodation_id: form.accommodation_id || null,
          check_in: form.check_in || null,
          check_out: form.check_out || null,
          total_amount: total,
          payment_status: form.payment_status,
          notes: form.notes || null,
        });
        toast({ title: "Success", description: "Booking updated successfully" });
      } else {
        await apiClient.bookings.create({
          diver_id: form.diver_id,
          course_id: form.course_id || null,
          accommodation_id: form.accommodation_id || null,
          check_in: form.check_in || null,
          check_out: form.check_out || null,
          total_amount: total,
          notes: form.notes || null,
        });
        toast({ title: "Success", description: "Booking created successfully" });
      }
      setOpen(false);
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    }
  };

  const togglePayment = async (id: string, current: string) => {
    const next = current === "paid" ? "unpaid" : "paid";
    try {
      await apiClient.bookings.update(id, { payment_status: next });
      load();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
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
    paid: "bg-success/20 text-success border-success/30",
    unpaid: "bg-destructive/20 text-destructive border-destructive/30",
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Bookings & Invoices</h1>
          <p className="page-description">Manage course bookings, accommodations, and payments</p>
        </div>
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
              <div>
                <Label>Diver *</Label>
                <Select value={form.diver_id} onValueChange={(v) => setForm({ ...form, diver_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select diver" /></SelectTrigger>
                  <SelectContent>{divers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Course</Label>
                <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select course (optional)" /></SelectTrigger>
                  <SelectContent><SelectItem value="">None</SelectItem>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} (${c.price})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Accommodation</Label>
                <Select value={form.accommodation_id} onValueChange={(v) => setForm({ ...form, accommodation_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select accommodation (optional)" /></SelectTrigger>
                  <SelectContent><SelectItem value="">None</SelectItem>{accommodations.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.tier === "free_with_course" ? "Free" : `$${a.price_per_night}/night`})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check In</Label>
                  <Input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} />
                </div>
                <div>
                  <Label>Check Out</Label>
                  <Input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} />
                </div>
              </div>
              {editingId && (
                <div>
                  <Label>Payment Status</Label>
                  <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
                    <Badge variant="outline" className={`cursor-pointer ${statusColors[b.payment_status]}`} onClick={() => togglePayment(b.id, b.payment_status)}>
                      {b.payment_status}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex gap-1">
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
