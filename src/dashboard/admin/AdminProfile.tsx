import React, { useEffect, useState } from "react";
import { Camera, LockKeyhole, Save, UserRound } from "lucide-react";
import { useStore } from "../../hooks/useStore";
import "@/styles/admin_css/adminProfile.css";

const AdminProfile: React.FC = () => {
  const { user, updateProfile, changePassword } = useStore();
  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "", address: "", profileImage: "" });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setProfile({ fullName: user.fullName, email: user.email, phone: user.phone, address: user.address, profileImage: user.profileImage ?? "" });
  }, [user]);

  const handlePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const source = new Image();
      source.onload = () => {
        const scale = Math.min(1, 512 / Math.max(source.width, source.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));
        canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
        setProfile((current) => ({ ...current, profileImage: canvas.toDataURL("image/jpeg", 0.82) }));
      };
      source.src = String(reader.result ?? "");
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setMessage(""); setSaving(true);
    try { await updateProfile(profile); setMessage("Profile updated successfully."); } catch (err: any) { setError(err.response?.data?.error ?? "Unable to update profile."); } finally { setSaving(false); }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setMessage("");
    if (passwords.next.length < 8) return setError("New password must be at least 8 characters.");
    if (passwords.next !== passwords.confirm) return setError("New passwords do not match.");
    setSaving(true);
    try { await changePassword(passwords.current, passwords.next); setPasswords({ current: "", next: "", confirm: "" }); setMessage("Password changed successfully."); } catch (err: any) { setError(err.response?.data?.error ?? "Unable to change password."); } finally { setSaving(false); }
  };

  return (
    <div className="admin-profile">
      <div className="page-header"><h1 className="page-title">Admin Profile</h1><p className="page-subtitle">Manage your account information and security.</p></div>
      {(message || error) && <div className={error ? "profile-alert error" : "profile-alert success"}>{error || message}</div>}
      <div className="profile-grid">
        <form className="profile-card" onSubmit={saveProfile}>
          <div className="profile-card-title"><UserRound /><div><h2>Profile information</h2><p>Update the details customers see on orders.</p></div></div>
          <div className="profile-photo-row">
            <div className="profile-photo">{profile.profileImage ? <img src={profile.profileImage} alt="Admin profile" /> : <UserRound />}</div>
            <div><label className="profile-upload"><Camera /> Upload photo<input type="file" accept="image/*" onChange={handlePhoto} /></label>{profile.profileImage && <button type="button" className="profile-remove" onClick={() => setProfile((current) => ({ ...current, profileImage: "" }))}>Remove photo</button>}</div>
          </div>
          <label>Full name<input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} required /></label>
          <label>Email<input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required /></label>
          <label>Phone<input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} required /></label>
          <label>Delivery / business address<textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} required rows={3} /></label>
          <button className="profile-save" disabled={saving}><Save /> Save profile</button>
        </form>
        <form className="profile-card" onSubmit={savePassword}>
          <div className="profile-card-title"><LockKeyhole /><div><h2>Change password</h2><p>Use a unique password with at least 8 characters.</p></div></div>
          <label>Current password<input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required /></label>
          <label>New password<input type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} required /></label>
          <label>Confirm new password<input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required /></label>
          <button className="profile-save" disabled={saving}><LockKeyhole /> Change password</button>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
