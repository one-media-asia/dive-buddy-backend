import { useState, useEffect } from "react";
import { Users, ClipboardCheck, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/integrations/api/client";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDivers: 0,
    medicalCleared: 0,
    medicalPending: 0,
    onboardingCompleted: 0,
    onboardingPending: 0,
    upcomingBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const divers = await apiClient.divers.list();

        const totalDivers = divers.length;
        const medicalCleared = divers.filter((d: any) => d.medical_cleared).length;
        const medicalPending = totalDivers - medicalCleared;
        const onboardingCompleted = divers.filter((d: any) => d.onboarding_completed).length;
        const onboardingPending = totalDivers - onboardingCompleted;

        setStats({
          totalDivers,
          medicalCleared,
          medicalPending,
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
              <ClipboardCheck className="h-4 w-4" />
              Medical Cleared
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{stats.medicalCleared}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.medicalPending} pending</p>
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
            <div className="text-3xl font-bold text-warning">{stats.medicalPending + stats.onboardingPending}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Medical Clearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Medical Clearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {stats.medicalPending === 0
                  ? "All divers medically cleared!"
                  : `${stats.medicalPending} diver${stats.medicalPending !== 1 ? "s" : ""} need medical clearance`}
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-success h-2 rounded-full transition-all"
                  style={{ width: `${stats.totalDivers ? (stats.medicalCleared / stats.totalDivers) * 100 : 0}%` }}
                />
              </div>
            </div>
            <Button onClick={() => navigate('/divers')} className="w-full">
              View Divers
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
              <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-white ${stats.medicalCleared > 0 ? 'bg-success' : 'bg-muted-foreground'}`}>
                {stats.medicalCleared > 0 ? '✓' : '2'}
              </span>
              <span className="text-muted-foreground">
                Verify medical clearance and download PADI medical forms
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
