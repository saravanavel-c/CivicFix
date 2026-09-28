import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, 
  Shield, 
  HelpCircle, 
  Save, 
  Lock, 
  PhoneCall,
  MessageSquare,
  ChevronDown,
  Building,
  Key
} from 'lucide-react';
import { userService } from '../services/userService';
import { LoadingState } from '../components/common/LoadingState';
import { Button } from '../components/common/Button';
import { FormInput } from '../components/common/FormInput';
import { Toast } from '../components/common/Toast';

export const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  // Search parameters for tab routing
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'info';

  // Form states
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [avatar, setAvatar] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const u = await userService.getUserProfile();
      setProfile(u);
      setUserId(u.id || 'USR-C001');
      setName(u.name || '');
      setUsername(u.username || 'user_civic');
      setEmail(u.email || '');
      setPhone(u.phone || '');
      setDepartment(u.department || '');
      setAvatar(u.avatar || 'https://randomuser.me/api/portraits/men/32.jpg');
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await userService.updateUserProfile({
        name,
        username,
        email,
        phone,
        department,
        avatar
      });
      setProfile(updated);
      setToastMsg('Profile updated successfully.');
      setShowToast(true);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setTimeout(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsUpdatingPassword(false);
      setToastMsg('Password updated successfully.');
      setShowToast(true);
    }, 800);
  };

  const tabs = [
    { id: 'info', label: 'Personal Details', icon: User },
    { id: 'security', label: 'Security & Login', icon: Shield },
    { id: 'help', label: 'Help & Support', icon: HelpCircle }
  ];

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const faqs = [
    {
      q: "How long does it take for a reported issue to be fixed?",
      a: "Standard repairs like minor potholes are typically acknowledged within 24 hours and completed within 3 to 5 business days. Severe structural or drainage blocks may take longer depending on technical assessments."
    },
    {
      q: "Can other citizens view issues I have reported?",
      a: "Yes, reports are displayed publicly on the 'Nearby Issues' map so neighbors are kept aware and don't file duplicates. Personal email and phone numbers are kept confidential."
    },
    {
      q: "What is role-based access control in CivicFix?",
      a: "CivicFix categorizes users into Citizen, Department User, Worker, and Admin. Each role gets specialized views tailored to their workflow."
    }
  ];

  if (isLoading) {
    return <LoadingState type="spinner" className="h-96" />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-display tracking-tight">
          User Profile
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your profile information, department details, and account security.
        </p>
      </div>

      {/* Tab controls & panels grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Navigation Sidebar Selector: Column 1 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm space-y-1 lg:col-span-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-left select-none cursor-pointer ${
                  isTabActive 
                    ? 'bg-primary-50 border border-primary-100/50 text-primary-600'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected tab panel details: Columns 2, 3, 4 */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: PERSONAL DETAILS INFO */}
          {activeTab === 'info' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 animate-scale-up">
              <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-100 pb-5">
                <div className="h-20 w-20 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-base font-bold text-slate-800">{name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                      {profile?.role || 'Citizen'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">@{username}</p>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                {/* User ID - READ ONLY */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-slate-400" />
                      <span>User ID (Unique Key)</span>
                      <span className="text-[10px] text-slate-400 font-normal">[Read Only]</span>
                    </label>
                    <input
                      type="text"
                      value={userId}
                      disabled
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 font-bold cursor-not-allowed select-all"
                    />
                  </div>

                  <FormInput 
                    label="Full Name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput 
                    label="Username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />

                  <FormInput 
                    label="Email Address"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput 
                    label="Phone Number"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />

                  {(profile?.role === 'Department' || profile?.role === 'Worker' || department) && (
                    <FormInput 
                      label="Department"
                      name="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Road Maintenance"
                    />
                  )}
                </div>

                <div>
                  <FormInput 
                    label="Profile Photo URL"
                    name="avatar"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button 
                    type="submit" 
                    isLoading={isSaving} 
                    variant="primary" 
                    size="md"
                    icon={Save}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SECURITY & LOGIN */}
          {activeTab === 'security' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 animate-scale-up">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display">Change Password</h3>
                <p className="text-xs text-slate-400 mt-0.5">Keep your account secure by modifying password credentials periodically.</p>
              </div>

              <form onSubmit={handlePasswordSave} className="space-y-4">
                <FormInput 
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput 
                    label="New Password"
                    name="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <FormInput 
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button 
                    type="submit" 
                    isLoading={isUpdatingPassword} 
                    variant="primary" 
                    size="md"
                    icon={Lock}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: HELP & SUPPORT */}
          {activeTab === 'help' && (
            <div className="space-y-6 animate-scale-up">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100/50 space-y-2 text-center sm:text-left">
                  <PhoneCall className="h-5 w-5 text-primary-600 mx-auto sm:mx-0" />
                  <p className="text-xs font-bold text-slate-800">Municipal Grievances Helpline</p>
                  <p className="text-lg font-bold text-primary-600 font-display">1800-425-1080</p>
                  <p className="text-[10px] text-slate-400">Toll-free | Operational 24/7</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-center sm:text-left">
                  <MessageSquare className="h-5 w-5 text-slate-500 mx-auto sm:mx-0" />
                  <p className="text-xs font-bold text-slate-800">CivicFix AI Support Bot</p>
                  <p className="text-lg font-bold text-slate-700 font-display">+91 90033 12345</p>
                  <p className="text-[10px] text-slate-400">Text 'Support' for Instant Assistance</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 font-display">Frequently Asked Questions</h3>
                <div className="divide-y divide-slate-100">
                  {faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div key={idx} className="py-3.5">
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between text-left font-semibold text-xs text-slate-700 hover:text-primary-600 transition-colors focus:outline-none cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-primary-600' : ''}`} />
                        </button>
                        {isOpen && (
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed animate-scale-up font-medium pl-1 border-l-2 border-primary-500">
                            {faq.a}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <Toast 
          message={toastMsg} 
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default Profile;
