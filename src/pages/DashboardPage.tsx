import { useState, useEffect } from "react";
import { Users, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/integrations/api/client";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDivers: 0,
    waiversSigned: 0,
    waiversPending: 0,
    onboardingCompleted: 0,
    onboardingPending: 0,
    upcomingBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const divers = await apiClient.divers.list();
        const waivers = await apiClient.waivers.list();

        const totalDivers = divers.length;
        const waiversSigned = divers.filter((d: any) => d.waiver_signed).length;
        const waiversPending = totalDivers - waiversSigned;
        const onboardingCompleted = divers.filter((d: any) => d.onboarding_completed).length;
        const onboardingPending = totalDivers - onboardingCompleted;

        setStats({
          totalDivers,
          waiversSigned,
          waiversPending,
          onboardingCompleted,
          onboardingPending,
          upcomingBookings: 0,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="page-header mb-6">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your diving operations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Divers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalDivers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Waivers Signed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{stats.waiversSigned}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.waiversPending} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Onboarding Done
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{stats.onboardingCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.onboardingPending} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{stats.waiversPending + stats.onboardingPending}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Waivers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Digital Waivers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {stats.waiversPending === 0
                  ? "All waivers are signed!"
                  : `${stats.waiversPending} diver${stats.waiversPending !== 1 ? "s" : ""} need to sign waivers`}
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-success h-2 rounded-full transition-all"
                  style={{ width: `${stats.totalDivers ? (stats.waiversSigned / stats.totalDivers) * 100 : 0}%` }}
                />
              </div>
            </div>
            <Button onClick={() => navigate('/waivers')} className="w-full">
              Manage Waivers
            </Button>
          </CardContent>
        </Card>

        {/* Onboarding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {stats.onboardingPending === 0
                  ? "All divers onboarded!"
                  : `${stats.onboardingPending} diver${stats.onboardingPending !== 1 ? "s" : ""} pending onboarding`}
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-success h-2 rounded-full transition-all"
                  style={{ width: `${stats.totalDivers ? (stats.onboardingCompleted / stats.totalDivers) * 100 : 0}%` }}
                />
              </div>
            </div>
            <Button onClick={() => navigate('/divers')} className="w-full">
              View Divers
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => navigate('/divers')} variant="outline" className="w-full justify-start">
              Add New Diver
            </Button>
            <Button onClick={() => navigate('/waivers')} variant="outline" className="w-full justify-start">
              Sign Waiver
            </Button>
            <Button onClick={() => navigate('/bookings')} variant="outline" className="w-full justify-start">
              Create Booking
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${stats.totalDivers > 0 ? 'bg-success' : 'bg-muted-foreground'}`}>
                {stats.totalDivers > 0 ? '✓' : '1'}
              </span>
              <span className="text-muted-foreground">
                Add divers and their information to the system
              </span>
            </li>
            <li className="flex gap-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${stats.waiversSigned > 0 ? 'bg-success' : 'bg-muted-foreground'}`}>
                {stats.waiversSigned > 0 ? '✓' : '2'}
              </span>
              <span className="text-muted-foreground">
                Have divers sign digital waivers
              </span>
            </li>
            <li className="flex gap-3">
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${stats.onboardingCompleted > 0 ? 'bg-success' : 'bg-muted-foreground'}`}>
                {stats.onboardingCompleted > 0 ? '✓' : '3'}
              </span>
              <span className="text-muted-foreground">
                Complete onboarding for each diver
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
