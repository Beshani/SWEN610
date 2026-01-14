import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import { LoginUser } from "../models/user";
import type { LoginResponse } from "../models/auth";

interface LoginPageProps {
  onLogin: (user: LoginUser, isAdmin: boolean) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign up form state
  const [signUpData, setSignUpData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    handle: "",
    password: "",
    confirmPassword: "",
  });
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);
  const [signUpSubmitting, setSignUpSubmitting] = useState(false);

  // ---- LOGIN HANDLER ----
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const data: LoginResponse = await authService.login({ username, password });
      const user = new LoginUser(
        data.member_id,
        data.username,
        data.email,
        data.is_admin
      );
      onLogin(user, data.is_admin);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- SIGNUP HANDLER ----
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    setSignUpSuccess(null);

    const firstName = signUpData.firstName.trim();
    const lastName = signUpData.lastName.trim();
    const email = signUpData.email.trim();
    const userName = signUpData.username.trim();
    let handle = signUpData.handle.trim();
    const pwd = signUpData.password;
    const confirmPwd = signUpData.confirmPassword;

    // Basic validation
    if (!firstName) {
      setSignUpError("First name is required");
      return;
    }
    if (!lastName) {
      setSignUpError("Last name is required");
      return;
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setSignUpError("Valid email is required");
      return;
    }
    if (!userName) {
      setSignUpError("Username is required");
      return;
    }
    if (/\s/.test(userName)) {
      setSignUpError("Username must not contain spaces");
      return;
    }
    if (!handle) {
      setSignUpError("Handle is required");
      return;
    }
    if (!handle.startsWith("@")) {
      handle = "@" + handle;
    }
    if (handle === "@") {
      setSignUpError('Handle must contain characters after "@"');
      return;
    }
    if (pwd.length < 6) {
      setSignUpError("Password must be at least 6 characters");
      return;
    }
    if (pwd !== confirmPwd) {
      setSignUpError("Passwords do not match");
      return;
    }

    setSignUpSubmitting(true);
    try {
      await userService.signUpUser({
        first_name: firstName,
        last_name: lastName,
        email,
        username: userName,
        handle,
        password: pwd,
      });

      setSignUpSuccess("Account created successfully. You can now sign in.");
      setSignUpData({
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        handle: "",
        password: "",
        confirmPassword: "",
      });
      setActiveTab("login");
    } catch (err: any) {
        const rawMessage: string = err?.message ?? "";

        // Try reading HTTP status from apiClient response
        const status = (err as any)?.status ?? (err as any)?.response?.status;
        const detail =
          (err as any)?.response?.data?.detail ??
          (err as any)?.detail ??
          rawMessage;

        // ---- DUPLICATE USERNAME HANDLING ----
        if (
          (typeof detail === "string" &&
            detail.toLowerCase().includes("username") &&
            detail.toLowerCase().includes("exists")) ||
          rawMessage.toLowerCase().includes("duplicate key") &&
            rawMessage.toLowerCase().includes("username")
        ) {
          setSignUpError(
            "This username is already taken. Please choose another one."
          );
        }
        // If backend returns 409 or 400 for duplicates
        else if (status === 409 || status === 400) {
          setSignUpError(detail || "Could not create account.");
        } 
        else {
          setSignUpError(rawMessage || "Failed to create account.");
        }
      } finally {
        // 👈 THIS is what guarantees the button unfreezes
        setSignUpSubmitting(false);
      }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>TaskMaster Login Console</CardTitle>
          <CardDescription>
            Sign in to access your workspaces and boards, or create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "login" | "signup")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* ---- LOGIN TAB ---- */}
            <TabsContent value="login">
              <form onSubmit={handleLoginSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600" role="alert">
                    {error}
                  </div>
                )}

                {signUpSuccess && (
                  <div className="text-sm text-green-600" role="status">
                    {signUpSuccess}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Signing In…" : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* ---- SIGNUP TAB ---- */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUpSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={signUpData.firstName}
                      onChange={(e) =>
                        setSignUpData((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={signUpData.lastName}
                      onChange={(e) =>
                        setSignUpData((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={signUpData.email}
                    onChange={(e) =>
                      setSignUpData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signupUsername">Username</Label>
                  <Input
                    id="signupUsername"
                    type="text"
                    placeholder="johndoe"
                    value={signUpData.username}
                    onChange={(e) =>
                      setSignUpData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handle">Handle</Label>
                  <Input
                    id="handle"
                    type="text"
                    placeholder="@johndoe"
                    value={signUpData.handle}
                    onChange={(e) =>
                      setSignUpData((prev) => ({
                        ...prev,
                        handle: e.target.value,
                      }))
                    }
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Must start with <span className="font-mono">@</span>. If you
                    omit it, we’ll add it for you.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Password</Label>
                  <Input
                    id="signupPassword"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={signUpData.password}
                    onChange={(e) =>
                      setSignUpData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={signUpData.confirmPassword}
                    onChange={(e) =>
                      setSignUpData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                {signUpError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {signUpError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={signUpSubmitting}
                >
                  {signUpSubmitting ? "Creating Account…" : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
