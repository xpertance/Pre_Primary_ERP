"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Alert from "@/components/common/Alert";
import { showToast } from "@/lib/toast";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import {
  Settings,
  School,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Save,
  RotateCcw,
  CheckCircle2,
  Zap,
  Shield,
  Bell
} from "lucide-react";

interface SchoolSettings {
  _id?: string;
  schoolName: string;
  schoolLogo: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  principalName: string;
  academicYear: string;
  featureFlags?: {
    enableTransport: boolean;
    enableMealPlan: boolean;
    enableGallery: boolean;
    enableEvents: boolean;
    enableOnlinePayment: boolean;
    enableClaudeHaiku45?: boolean;
  };
}

const FEATURE_CONFIG = [
  {
    key: "enableTransport",
    label: "Transport Management",
    description: "Manage transport routes, vehicles, and student assignments",
    icon: "🚌",
  },
  {
    key: "enableMealPlan",
    label: "Meal Plan Management",
    description: "Create and manage weekly meal schedules and nutrition plans",
    icon: "🍽️",
  },
  {
    key: "enableGallery",
    label: "Photo Gallery",
    description: "Upload and manage photo albums for events and activities",
    icon: "📸",
  },
  {
    key: "enableEvents",
    label: "Event Management",
    description: "Create and announce school events and notifications",
    icon: "📅",
  },
  {
    key: "enableOnlinePayment",
    label: "Online Payments",
    description: "Enable online fee payment through payment gateway",
    icon: "💳",
  },
  {
    key: "enableClaudeHaiku45",
    label: "Claude Haiku 4.5",
    description: "Enable Claude Haiku 4.5 model for all AI-powered features",
    icon: "🤖",
  },
];

export default function SettingsManagement() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<SchoolSettings>({
    schoolName: "",
    schoolLogo: "",
    schoolAddress: "",
    schoolPhone: "",
    schoolEmail: "",
    principalName: "",
    academicYear: "",
    featureFlags: {
      enableTransport: true,
      enableMealPlan: true,
      enableGallery: true,
      enableEvents: true,
      enableOnlinePayment: true,
      enableClaudeHaiku45: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setFormData(data.settings);
      }
    } catch (err) {
      showToast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast.success("Settings updated successfully");
        await fetchSettings();
      } else {
        showToast.error("Failed to update settings");
      }
    } catch (err) {
      showToast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFeatureToggle = (key: string) => {
    setFormData(prev => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags!,
        [key]: !prev.featureFlags![key as keyof typeof prev.featureFlags]
      }
    }));
  };

  const enabledFeaturesCount = formData.featureFlags
    ? Object.values(formData.featureFlags).filter(Boolean).length
    : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]} />

      {/* Header */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">School Settings</h1>
            <p className="text-gray-600 mt-1">Manage school information and system features</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-2">Academic Year</p>
              <p className="text-3xl font-bold text-blue-600">{formData.academicYear || "Not Set"}</p>
            </div>
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-2">Active Features</p>
              <p className="text-3xl font-bold text-green-600">{enabledFeaturesCount} / 6</p>
            </div>
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl">
          {/* School Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                <School className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">School Information</h2>
                <p className="text-sm text-gray-600">Basic details about your school</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <School className="w-4 h-4 inline mr-1" />
                  School Name
                </label>
                <input
                  type="text"
                  name="schoolName"
                  placeholder="Enter school name"
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Principal Name
                </label>
                <input
                  type="text"
                  name="principalName"
                  placeholder="Enter principal name"
                  value={formData.principalName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  School Email
                </label>
                <input
                  type="email"
                  name="schoolEmail"
                  placeholder="school@example.com"
                  value={formData.schoolEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  School Phone
                </label>
                <input
                  type="tel"
                  name="schoolPhone"
                  placeholder="Enter 10-digit phone number"
                  value={formData.schoolPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '');
                    setFormData(prev => ({ ...prev, schoolPhone: value }));
                  }}
                  maxLength={10}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Academic Year
                </label>
                <input
                  type="text"
                  name="academicYear"
                  placeholder="e.g., 2024-2025"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  School Logo URL
                </label>
                <input
                  type="text"
                  name="schoolLogo"
                  placeholder="https://example.com/logo.png"
                  value={formData.schoolLogo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  School Address
                </label>
                <textarea
                  name="schoolAddress"
                  placeholder="Enter complete school address"
                  value={formData.schoolAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Feature Management */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Feature Management</h2>
                <p className="text-sm text-gray-600">Enable or disable system features</p>
              </div>
            </div>

            <div className="space-y-3">
              {formData.featureFlags && FEATURE_CONFIG.map((feature) => {
                const isEnabled = formData.featureFlags![feature.key as keyof typeof formData.featureFlags];
                return (
                  <div
                    key={feature.key}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${isEnabled
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    onClick={() => handleFeatureToggle(feature.key)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{feature.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-800">{feature.label}</h3>
                          {isEnabled && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                      <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleFeatureToggle(feature.key);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex justify-end gap-3">
              <button
                onClick={() => fetchSettings()}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Changes
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}