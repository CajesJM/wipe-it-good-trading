import React, { useEffect, useState } from "react";
import {
  Camera,
  LockKeyhole,
  LocateFixed,
  UserRound,
  MapPin,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../../hooks/useStore";
import {
  fetchPhilippinePlaces,
  usePhilippineLocations,
} from "../../hooks/usePhilippineLocations";
import Toast from "../../components/Toast";
import "../../styles/admin_css/adminProfile.css";

const phonePattern = /^\+639\d{9}$/;
const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const national = digits.startsWith("63")
    ? digits.slice(2)
    : digits.startsWith("0")
      ? digits.slice(1)
      : digits;
  return `+63${national.slice(0, 10)}`;
};

const UserProfile: React.FC = () => {
  const { user, addresses, updateProfile, changePassword } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const defaultAddress =
    addresses.find((item) => item.isDefault) ?? addresses[0];
  const locations = usePhilippineLocations();
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    profileImage: "",
    region: "",
    province: "",
    city: "",
    barangay: "",
    postalCode: "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPasswords, setShowNewPasswords] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  useEffect(() => {
    const text = error || message;
    if (text) setToast({ message: text, type: error ? "error" : "success" });
  }, [error, message]);

  useEffect(() => {
    if (user)
      setProfile((current) => ({
        ...current,
        fullName: user.fullName,
        email: user.email,
        phone: normalizePhone(user.phone || "+63"),
        address: user.address,
        profileImage: user.profileImage ?? "",
        region: defaultAddress?.region ?? current.region,
        province: defaultAddress?.province ?? current.province,
        city: defaultAddress?.city ?? current.city,
        barangay: defaultAddress?.barangay ?? current.barangay,
        postalCode: defaultAddress?.postalCode ?? current.postalCode,
      }));
  }, [user, defaultAddress]);
  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  useEffect(() => {
    if (profile.region && !locations.regionCode) {
      const match = locations.regions.find(
        (item) => item.name === profile.region,
      );
      if (match) locations.setRegionCode(match.code);
    }
  }, [profile.region, locations.regionCode, locations.regions]);
  useEffect(() => {
    if (profile.province && locations.regionCode && !locations.provinceCode) {
      const match = locations.provinces.find(
        (item) => item.name === profile.province,
      );
      if (match) locations.setProvinceCode(match.code);
    }
  }, [
    profile.province,
    locations.regionCode,
    locations.provinceCode,
    locations.provinces,
  ]);
  useEffect(() => {
    if (profile.city && locations.provinceCode && !locations.cityCode) {
      const match = locations.cities.find((item) => item.name === profile.city);
      if (match) locations.setCityCode(match.code);
    }
  }, [
    profile.city,
    locations.provinceCode,
    locations.cityCode,
    locations.cities,
  ]);
  const setField = (key: keyof typeof profile, value: string) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const handlePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Please choose an image smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const source = new Image();
      source.onload = () => {
        const scale = Math.min(1, 512 / Math.max(source.width, source.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));
        canvas
          .getContext("2d")
          ?.drawImage(source, 0, 0, canvas.width, canvas.height);
        setField("profileImage", canvas.toDataURL("image/jpeg", 0.78));
      };
      source.src = String(reader.result ?? "");
    };
    reader.readAsDataURL(file);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location is not available in this browser.");
      return;
    }
    setError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1&accept-language=en&countrycodes=ph`,
          );
          const result = await response.json();
          if (result?.address?.country_code !== "ph")
            throw new Error(
              "Your current location is outside the Philippines.",
            );
          const a = result.address;
          const regions = await fetchPhilippinePlaces("/regions/");
          const region = regions.find((item) =>
            String(a.region ?? a.state ?? "")
              .toLowerCase()
              .includes(item.name.toLowerCase().replace(" region", "")),
          );
          if (!region)
            throw new Error(
              "GPS could not match a Philippine region. Please select it manually.",
            );
          const provinces = await fetchPhilippinePlaces(
            `/regions/${region.code}/provinces/`,
          );
          const province = provinces.find((item) =>
            String(a.province ?? a.state ?? "")
              .toLowerCase()
              .includes(item.name.toLowerCase()),
          );
          if (!province)
            throw new Error(
              "GPS could not match a Philippine province. Please select it manually.",
            );
          const cities = await fetchPhilippinePlaces(
            `/provinces/${province.code}/cities-municipalities/`,
          );
          const city = cities.find((item) =>
            String(a.city ?? a.municipality ?? a.town ?? "")
              .toLowerCase()
              .includes(item.name.toLowerCase()),
          );
          if (!city)
            throw new Error(
              "GPS could not match a Philippine city. Please select it manually.",
            );
          const barangays = await fetchPhilippinePlaces(
            `/cities-municipalities/${city.code}/barangays/`,
          );
          const barangay = barangays.find((item) =>
            String(a.suburb ?? a.village ?? a.barangay ?? "")
              .toLowerCase()
              .includes(item.name.toLowerCase()),
          );
          if (!barangay)
            throw new Error(
              "GPS could not match a Philippine barangay. Please select it manually.",
            );
          locations.setRegionCode(region.code);
          locations.setProvinceCode(province.code);
          locations.setCityCode(city.code);
          setProfile((current) => ({
            ...current,
            region: region.name,
            province: province.name,
            city: city.name,
            barangay: barangay.name,
            postalCode: String(a.postcode ?? ""),
            address: String(result.display_name ?? current.address)
              .split(",")
              .slice(0, 2)
              .join(", "),
          }));
          setMessage(
            "Current Philippine location detected. Review it before saving.",
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to read your current location.",
          );
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError(
          "Location permission was denied. Select your address manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!phonePattern.test(profile.phone)) {
      setError("Use the Philippine international format: +639XXXXXXXXX.");
      return;
    }
    if (
      !profile.region ||
      !profile.province ||
      !profile.city ||
      !profile.barangay
    ) {
      setError("Select a complete Philippine delivery address.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(profile);
      setMessage("Profile saved. You can now continue checkout.");
    } catch (err: any) {
      const details = err.response?.data?.details;
      setError(
        Array.isArray(details) && details.length
          ? details.map((item: any) => item.message).join(" ")
          : (err.response?.data?.error ?? "Unable to save your profile."),
      );
    } finally {
      setSaving(false);
    }
  };
  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (passwords.next.length < 8)
      return setError("New password must be at least 8 characters.");
    if (passwords.next !== passwords.confirm)
      return setError("New passwords do not match.");
    setSaving(true);
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirm: "" });
      setShowCurrentPassword(false);
      setShowNewPasswords(false);
      setMessage("Password changed successfully.");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Unable to change password.");
    } finally {
      setSaving(false);
    }
  };
  const continuePath = new URLSearchParams(location.search).get("next");
  return (
    <main className="admin-profile customer-profile">
      <Toast
        message={toast?.message ?? ""}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      <div className="page-header profile-hero">
        <div className="profile-hero-copy">
          <span className="profile-eyebrow">Customer account</span>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">
            Manage your identity, Philippine delivery information, and account
            security.
          </p>
        </div>
        <div className="profile-status-card">
          <ShieldCheck />
          <span>
            <strong>Verified account</strong>
            {user.email}
          </span>
        </div>
      </div>
      <div className="profile-grid">
        <form
          className="profile-card account-profile-card"
          onSubmit={saveProfile}
        >
          <div className="profile-card-title">
            <UserRound />
            <div>
              <h2>Account and delivery information</h2>
              <p>Only Philippine locations are available for delivery.</p>
            </div>
          </div>
          <div className="profile-photo-row">
            <div className="profile-photo">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="Profile" />
              ) : (
                <UserRound />
              )}
            </div>
            <div>
              <label className="profile-upload">
                <Camera /> Upload photo
                <input type="file" accept="image/*" onChange={handlePhoto} />
              </label>
              {profile.profileImage && (
                <button
                  type="button"
                  className="profile-remove"
                  onClick={() => setField("profileImage", "")}
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
          <label>
            Full name
            <input
              value={profile.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              required
              minLength={2}
            />
          </label>
          <label>
            Gmail address
            <input type="email" value={profile.email} readOnly />
          </label>
          <label>
            Mobile number
            <input
              value={profile.phone}
              onChange={(e) =>
                setField("phone", normalizePhone(e.target.value))
              }
              placeholder="+63XXXXXXXXXX"
              inputMode="tel"
              maxLength={13}
              required
            />
            <small className="field-hint">Philippines format only</small>
          </label>
          <div className="address-heading">
            <span>
              <MapPin size={14} /> Delivery address
            </span>
            <button
              type="button"
              className="location-btn"
              onClick={useCurrentLocation}
              disabled={locating}
            >
              <LocateFixed size={14} />{" "}
              {locating ? "Locating…" : "Use current location"}
            </button>
          </div>
          {locations.error && (
            <small className="field-hint error-text">{locations.error}</small>
          )}
          <label>
            Region
            <select
              value={locations.regionCode}
              onChange={(e) => {
                const selected = locations.regions.find(
                  (item) => item.code === e.target.value,
                );
                setField("region", selected?.name ?? "");
                setProfile((c) => ({
                  ...c,
                  region: selected?.name ?? "",
                  province: "",
                  city: "",
                  barangay: "",
                }));
                locations.setRegionCode(e.target.value);
              }}
              required
            >
              <option value="">
                {locations.loading ? "Loading regions…" : "Select region"}
              </option>
              {locations.regions.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Province
            <select
              value={locations.provinceCode}
              onChange={(e) => {
                const selected = locations.provinces.find(
                  (item) => item.code === e.target.value,
                );
                setProfile((c) => ({
                  ...c,
                  province: selected?.name ?? "",
                  city: "",
                  barangay: "",
                }));
                locations.setProvinceCode(e.target.value);
              }}
              disabled={!locations.regionCode}
              required
            >
              <option value="">Select province</option>
              {locations.provinces.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            City / Municipality
            <select
              value={locations.cityCode}
              onChange={(e) => {
                const selected = locations.cities.find(
                  (item) => item.code === e.target.value,
                );
                setProfile((c) => ({
                  ...c,
                  city: selected?.name ?? "",
                  barangay: "",
                }));
                locations.setCityCode(e.target.value);
              }}
              disabled={!locations.provinceCode}
              required
            >
              <option value="">Select city or municipality</option>
              {locations.cities.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Barangay
            <select
              value={
                locations.barangays.find(
                  (item) => item.name === profile.barangay,
                )?.code ?? ""
              }
              onChange={(e) => {
                const selected = locations.barangays.find(
                  (item) => item.code === e.target.value,
                );
                setField("barangay", selected?.name ?? "");
              }}
              disabled={!locations.cityCode}
              required
            >
              <option value="">Select barangay</option>
              {locations.barangays.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            House / Street / Building
            <input
              value={profile.address}
              onChange={(e) =>
                setField(
                  "address",
                  e.target.value.replace(/[^\w\s.,#'\-/]/g, ""),
                )
              }
              placeholder="House number and street"
              required
              minLength={3}
            />
          </label>
          <button className="profile-save" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          {continuePath && (
            <button
              type="button"
              className="profile-secondary"
              onClick={() => navigate(continuePath)}
            >
              Continue to checkout
            </button>
          )}
        </form>
        <form
          className="profile-card security-profile-card"
          onSubmit={savePassword}
        >
          <div className="profile-card-title">
            <LockKeyhole />
            <div>
              <h2>Security</h2>
              <p>Use a unique password with at least 8 characters.</p>
            </div>
          </div>
          <label>
            Current password
            <span className="password-input-wrap">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwords.current}
                onChange={(e) =>
                  setPasswords({ ...passwords, current: e.target.value })
                }
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-eye-btn"
                onClick={() => setShowCurrentPassword((visible) => !visible)}
                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                aria-pressed={showCurrentPassword}
              >
                {showCurrentPassword ? <EyeOff /> : <Eye />}
              </button>
            </span>
          </label>
          <label>
            New password
            <input
              type={showNewPasswords ? "text" : "password"}
              value={passwords.next}
              onChange={(e) =>
                setPasswords({ ...passwords, next: e.target.value })
              }
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
          <label>
            Confirm new password
            <input
              type={showNewPasswords ? "text" : "password"}
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords({ ...passwords, confirm: e.target.value })
              }
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
          <button
            type="button"
            className="password-pair-toggle"
            onClick={() => setShowNewPasswords((visible) => !visible)}
            aria-pressed={showNewPasswords}
          >
            {showNewPasswords ? <EyeOff /> : <Eye />}
            {showNewPasswords ? "Hide new and confirm passwords" : "Show new and confirm passwords"}
          </button>
          <button className="profile-save" disabled={saving}>
            <LockKeyhole /> Change password
          </button>
        </form>
      </div>
    </main>
  );
};
export default UserProfile;
