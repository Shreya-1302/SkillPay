import { useState, useRef } from 'react';
import { updateProfile } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { User, Mail, Shield, Camera, Loader2, Upload, BadgeCheck, AlertCircle, BookOpen, Star } from 'lucide-react';
import Navbar from '../components/Navbar';

const Profile = () => {
  const { user } = useAuth();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  
  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (user?.role === 'student') {
        formData.append('bio', bio.trim());
        formData.append('skills', skills);
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      const updatedUser = await updateProfile(formData);
      updateUser(updatedUser); // Update global state
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const avatarSrc = previewUrl || user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random&size=128`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
          {/* ── Avatar header ── */}
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 px-6 py-8 flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img
                src={avatarSrc}
                alt="Avatar"
                className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-md group-hover:opacity-80 transition-opacity"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${user?.name}&background=random&size=128`;
                }}
              />
              <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-sm group-hover:scale-110 transition-transform">
                <Camera className="h-3.5 w-3.5" />
              </span>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{user?.name}</p>
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                {user?.role}
              </span>
            </div>
          </div>

          {/* ── Info cards ── */}
          <div className="grid grid-cols-2 gap-4 px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="overflow-hidden">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium capitalize">{user?.role}</p>
              </div>
            </div>
            {user?.role === 'student' && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 col-span-2">
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <div>
                    <p className="text-xs text-muted-foreground">College Email</p>
                    <p className="text-sm font-medium truncate">{user?.collegeEmail || 'Not provided'}</p>
                  </div>
                  {user?.emailVerified ? (
                    <span className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-1 rounded-full text-xs font-semibold">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full text-xs font-semibold">
                      <AlertCircle className="h-3.5 w-3.5" /> Unverified
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Edit form ── */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            <h2 className="text-lg font-semibold">Edit Profile</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {user?.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="Tell clients about your background and expertise..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Skills</label>
                  <div className="relative">
                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="React, UI Design, Python (comma separated)"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
