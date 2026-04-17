import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin.api";
import { Palette, Upload, Save } from "lucide-react";

export const OrganizationBrandingPage: React.FC = () => {
  const [branding, setBranding] = useState({
    organizationName: "",
    logo: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6",
    accentColor: "#ec4899",
    emailSignature: "",
    supportEmail: "",
    websiteUrl: "",
    socialLinks: {
      twitter: "",
      linkedin: "",
      facebook: "",
      instagram: "",
    },
  });

  const { data: currentBranding, isLoading } = useQuery({
    queryKey: ["organizationBranding"],
    queryFn: () =>
      adminApi.getOrganizationBranding?.() || Promise.resolve(null),
  });

  useEffect(() => {
    if (currentBranding) {
      setBranding(currentBranding);
    }
  }, [currentBranding]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof branding) =>
      adminApi.updateOrganizationBranding?.(data),
    onSuccess: () => alert("Branding updated successfully!"),
  });

  const handleSocialLinkChange = (platform: string, value: string) => {
    setBranding({
      ...branding,
      socialLinks: { ...branding.socialLinks, [platform]: value },
    });
  };

  if (isLoading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Organization Branding
            </h1>
          </div>
          <p className="text-gray-600">
            Customize your organization's look and feel
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate(branding);
          }}
          className="space-y-8"
        >
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={branding.organizationName}
                  onChange={(e) =>
                    setBranding({
                      ...branding,
                      organizationName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={branding.logo}
                    onChange={(e) =>
                      setBranding({ ...branding, logo: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                </div>
                {branding.logo && (
                  <img src={branding.logo} alt="Logo" className="mt-2 h-12" />
                )}
              </div>
            </div>
          </div>

          {/* Color Scheme */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Color Scheme
            </h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) =>
                      setBranding({ ...branding, primaryColor: e.target.value })
                    }
                    className="h-12 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.primaryColor}
                    onChange={(e) =>
                      setBranding({ ...branding, primaryColor: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) =>
                      setBranding({
                        ...branding,
                        secondaryColor: e.target.value,
                      })
                    }
                    className="h-12 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.secondaryColor}
                    onChange={(e) =>
                      setBranding({
                        ...branding,
                        secondaryColor: e.target.value,
                      })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={branding.accentColor}
                    onChange={(e) =>
                      setBranding({ ...branding, accentColor: e.target.value })
                    }
                    className="h-12 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.accentColor}
                    onChange={(e) =>
                      setBranding({ ...branding, accentColor: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="mt-6 flex gap-4">
              <div
                className="h-20 w-20 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: branding.primaryColor }}
                title="Primary"
              />
              <div
                className="h-20 w-20 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: branding.secondaryColor }}
                title="Secondary"
              />
              <div
                className="h-20 w-20 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: branding.accentColor }}
                title="Accent"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  value={branding.supportEmail}
                  onChange={(e) =>
                    setBranding({ ...branding, supportEmail: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="support@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={branding.websiteUrl}
                  onChange={(e) =>
                    setBranding({ ...branding, websiteUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Signature
                </label>
                <textarea
                  value={branding.emailSignature}
                  onChange={(e) =>
                    setBranding({ ...branding, emailSignature: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Your email signature..."
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Social Media Links
            </h2>
            <div className="space-y-4">
              {Object.entries(branding.socialLinks).map(([platform, url]) => (
                <div key={platform}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {platform} URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) =>
                      handleSocialLinkChange(platform, e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`https://${platform}.com/yourpage`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? "Saving..." : "Save Branding"}
            </button>
            <button
              type="button"
              onClick={() => setBranding(currentBranding || branding)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationBrandingPage;
