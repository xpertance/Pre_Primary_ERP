"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Alert from "@/components/common/Alert";
import { showToast } from "@/lib/toast";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import {
    User,
    Mail,
    Shield,
    Key,
    Save,
    Loader2,
    AlertCircle,
    BadgeCheck,
    Building
} from "lucide-react";

interface UserProfile {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
}

export default function ProfileManagement() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        firstName: "",
        lastName: "",
        email: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/auth/profile");
            if (res.ok) {
                const data = await res.json();
                setUserProfile(data.user);
                setFormData({
                    name: data.user.name || "",
                    firstName: data.user.firstName || "",
                    lastName: data.user.lastName || "",
                    email: data.user.email || "",
                });
            } else {
                showToast.error("Failed to fetch profile");
            }
        } catch (err) {
            showToast.error("Error fetching profile");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password && password !== confirmPassword) {
            showToast.error("Passwords do not match");
            return;
        }

        try {
            setSaving(true);
            const updatePayload: any = { ...formData };
            if (password) updatePayload.password = password;

            const response = await fetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatePayload),
            });

            if (response.ok) {
                showToast.success("Profile updated successfully");
                setPassword("");
                setConfirmPassword("");
                fetchProfile();
            } else {
                const data = await response.json();
                showToast.error(data.error || "Failed to update profile");
            }
        } catch (err) {
            showToast.error("Error updating profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Profile" }]} />

                <div className="mt-8 flex flex-col md:flex-row gap-8">
                    {/* Left Side - Profile Summary */}
                    <div className="w-full md:w-1/3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="h-32 bg-gradient-to-r from-blue-400 to-indigo-500 relative">
                                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                    <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center overflow-hidden">
                                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                            <User className="w-12 h-12 text-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-16 pb-8 px-6 text-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {userProfile?.name || `${userProfile?.firstName} ${userProfile?.lastName}` || "User Name"}
                                </h2>
                                <div className="flex items-center justify-center gap-1.5 mt-1 text-blue-600 font-medium text-sm">
                                    <Shield className="w-4 h-4" />
                                    <span className="capitalize">{userProfile?.role}</span>
                                </div>
                                <div className="mt-6 flex flex-col gap-3">
                                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-left border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                                        <p className="text-sm font-medium text-gray-700 truncate">{userProfile?.email}</p>
                                    </div>
                                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-left border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Type</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                                <BadgeCheck className="w-3.5 h-3.5" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700">Verified Administrator</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="w-full md:w-2/3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-500" />
                                    Profile Information
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Update your personal information and contact details</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {(userProfile?.role === 'admin' || userProfile?.role === 'parent') ? (
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Full Name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Your full name"
                                                icon={<User className="w-4 h-4" />}
                                                fullWidth
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <Input
                                                label="First Name"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                placeholder="First name"
                                                icon={<User className="w-4 h-4" />}
                                                fullWidth
                                            />
                                            <Input
                                                label="Last Name"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                placeholder="Last name"
                                                icon={<User className="w-4 h-4" />}
                                                fullWidth
                                            />
                                        </>
                                    )}

                                    <div className="md:col-span-2">
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="email@example.com"
                                            icon={<Mail className="w-4 h-4" />}
                                            fullWidth
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-1">
                                        <Key className="w-5 h-5 text-indigo-500" />
                                        Security Settings
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-6">Change your password to keep your account secure</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <Input
                                            label="New Password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            icon={<Key className="w-4 h-4" />}
                                            fullWidth
                                        />
                                        <Input
                                            label="Confirm Password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            icon={<Key className="w-4 h-4" />}
                                            fullWidth
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={saving}
                                        className="px-8"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Saving Changes...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <div className="mt-6 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">Important Note</h4>
                                <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                                    Changing your email address will require you to use the new email for future logins. Please ensure you have access to the new email address before saving.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
