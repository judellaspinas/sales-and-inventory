import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/AuthProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  LogOut,
  Package,
  Home,
  ArrowLeft,
  Edit3,
  Save,
  X,
  Key,
  Moon,
  Sun,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

/**
 * Profile page
 * - Mobile responsive (stacking inputs)
 * - All header buttons same size
 * - Dark mode toggle (saved in localStorage)
 * - Safer mutation handling
 */

function DarkModeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof window !== "undefined" ? localStorage.getItem("theme") === "dark" : false
  );

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <button
      aria-pressed={isDark}
      onClick={() => setIsDark((s) => !s)}
      className="inline-flex items-center justify-center h-10 w-10 rounded-lg border dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
      title="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    supply: "",
    supplyQuantity: "",
  });

  // unified button sizing for header and actions
  const headerBtnClass = "h-10 px-4";
  const actionBtnClass = "h-10 px-4";

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      supply: user.supply || "",
      supplyQuantity: user.supplyQuantity?.toString() || "",
    });
  }, [user, setLocation]);

  // Safer mutation: parse json and throw on non-OK
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        // try to surface useful message
        throw new Error(payload?.message || payload?.error || "Update failed");
      }
      return payload;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/me"], updatedUser);
      toast({ title: "Success", description: "Profile updated successfully!" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const handleSave = () => {
    const updateData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
    };

    if (user?.role === "supplier") {
      updateData.supply = formData.supply;
      updateData.supplyQuantity = formData.supplyQuantity
        ? parseInt(formData.supplyQuantity)
        : undefined;
    }

    updateMutation.mutate(updateData);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        supply: user.supply || "",
        supplyQuantity: user.supplyQuantity?.toString() || "",
      });
    }
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background dark:bg-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-card dark:bg-slate-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" aria-label="Back to dashboard">
                <Button variant="outline" size="sm" className={headerBtnClass}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>

              <div className="hidden sm:block">
                <DarkModeToggle />
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">User Profile</h1>
                  <p className="text-sm text-muted-foreground">Manage your account information</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Reset password available only to admins */}
              {String(user?.role || "").toLowerCase() === "admin" && (
                <Link href="/reset-staff-password">
                  <Button
                    variant="outline"
                    size="sm"
                    className={headerBtnClass}
                    data-testid="button-reset-password"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                </Link>
              )}

              <Link href="/products">
                <Button variant="outline" size="sm" className={headerBtnClass}>
                  <Package className="w-4 h-4 mr-2" />
                  Products
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button variant="outline" size="sm" className={headerBtnClass}>
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                className={headerBtnClass}
                onClick={handleLogout}
                aria-label="Logout"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>

                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className={actionBtnClass}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className={actionBtnClass}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancel} className={actionBtnClass}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isEditing) handleSave();
                }}
              >
                {/* Read-only fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={user.username}
                      readOnly
                      className="bg-muted text-muted-foreground"
                      data-testid="input-username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={
                        typeof user.role === "string"
                          ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                          : String(user.role)
                      }
                      readOnly
                      className="bg-muted text-muted-foreground"
                      data-testid="input-role"
                    />
                  </div>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                      data-testid="input-firstName"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                      data-testid="input-lastName"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, "") }))
                    }
                    readOnly={!isEditing}
                    maxLength={11}
                    className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                    data-testid="input-phone"
                  />
                </div>

                {String(user.role).toLowerCase() === "supplier" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supply">Supply Type</Label>
                      <Input
                        id="supply"
                        value={formData.supply}
                        onChange={(e) => setFormData((prev) => ({ ...prev, supply: e.target.value }))}
                        readOnly={!isEditing}
                        className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                        data-testid="input-supply"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplyQuantity">Supply Quantity</Label>
                      <Input
                        id="supplyQuantity"
                        type="number"
                        min={1}
                        value={formData.supplyQuantity}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, supplyQuantity: e.target.value }))
                        }
                        readOnly={!isEditing}
                        className={!isEditing ? "bg-muted text-muted-foreground" : ""}
                        data-testid="input-supplyQuantity"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Account Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Mobile: Dark toggle in footer area for convenience */}
      <div className="md:hidden fixed bottom-4 right-4">
        <div className="bg-card p-2 rounded-xl shadow-lg">
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
}
