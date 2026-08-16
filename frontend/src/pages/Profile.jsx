import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, 
  Shield, 
  HelpCircle, 
  Save, 
  Lock, 
  Languages, 
  PhoneCall,
  Search,
  MessageSquare,
  Globe,
  MapPin,
  ChevronDown
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('English');
  const [savedLocation, setSavedLocation] = useState('');

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
      setName(u.name);
      setEmail(u.email);
      setPhone(u.phone);
      setLanguage(u.preferredLanguage);
      setSavedLocation(u.savedLocation);
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
        email,
        phone,
        preferredLanguage: language,
        savedLocation
      });
      setProfile(updated);
      setToastMsg('Profile information updated successfully.');
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
      setToastMsg('Security configuration updated successfully.');
      setShowToast(true);
    }, 1000);
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
      a: "Yes, reports are displayed publicly on the 'Nearby Issues' map so neighbors are kept aware and don't file duplicates. However, your personal email and phone number are always kept strictly confidential."
    },
    {
      q: "What is AI Categorization & Routing?",
      a: "CivicFix uses deep learning vision systems to analyze photo attachments, auto-detect coordinates, suggest severity priorities, and route tickets directly to division managers without manual delay."
    },
    {
      q: "Can I edit details after submitting a complaint?",
      a: "For auditing safety, filed reports cannot be directly edited. You can upload comments or feedback once work begins, or contact support if incorrect locations were sent."
    }
  ];

  if (isLoading) {
    return <LoadingState type="spinner" className="h-96" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-display tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your personal details, preferred languages, security controls, and FAQ services.
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
                <div className="h-20 w-20 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <img src={profile?.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-0.5 text-center sm:text-left">
                  <h3 className="text-base font-bold text-slate-800">{name}</h3>
                  <p className="text-xs text-slate-400">Citizen account member since {profile?.joinedDate}</p>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput 
                    label="Full Name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                  <FormInput 
                    label="Preferred Language"
                    name="language"
                    type="select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    options={[
                      { value: 'English', label: 'English' },
                      { value: 'Tamil', label: 'Tamil / தமிழ்' },
                      { value: 'Hindi', label: 'Hindi / हिंदी' },
                      { value: 'Malayalam', label: 'Malayalam / മലയാളം' }
                    ]}
                  />
                </div>

                <FormInput 
                  label="Default Neighborhood / Coordinates Location"
                  name="savedLocation"
                  value={savedLocation}
                  onChange={(e) => setSavedLocation(e.target.value)}
                  placeholder="e.g. Gandhipuram, Coimbatore"
                />

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

              {/* Two Factor Mock */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">Two-Factor Authentication (2FA)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Secure your civic credentials with one-time verification pins.</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700">SMS Verification Codes</p>
                    <p className="text-[10px] text-slate-400">Receive logins verification pins on {phone}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HELP & SUPPORT FAQ */}
          {activeTab === 'help' && (
            <div className="space-y-6 animate-scale-up">
              
              {/* Emergency Helplines banner */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100/50 space-y-2 text-center sm:text-left">
                  <PhoneCall className="h-5 w-5 text-primary-600 mx-auto sm:mx-0" />
                  <p className="text-xs font-bold text-slate-800">Municipal Grievances Hotline</p>
                  <p className="text-lg font-bold text-primary-600 font-display">1800-425-1080</p>
                  <p className="text-[10px] text-slate-400">Toll-free | Operational 24/7</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-center sm:text-left">
                  <MessageSquare className="h-5 w-5 text-slate-500 mx-auto sm:mx-0" />
                  <p className="text-xs font-bold text-slate-800">CivicFix AI Whatsapp Bot</p>
                  <p className="text-lg font-bold text-slate-700 font-display">+91 90033 12345</p>
                  <p className="text-[10px] text-slate-400">Text 'Report' to file via Chat</p>
                </div>
              </div>

              {/* FAQs Accordion */}
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

              {/* Send message form */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">Submit a Support Ticket</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Need help with account access or feedback? Send our web team a message.</p>
                </div>
                <div className="space-y-4">
                  <FormInput 
                    label="Subject Title"
                    name="supportSubject"
                    placeholder="e.g. Account credentials sync issue"
                  />
                  <FormInput 
                    label="Message Description"
                    name="supportMessage"
                    type="textarea"
                    placeholder="Describe what you need help with..."
                    rows={4}
                  />
                  <Button 
                    onClick={() => {
                      setToastMsg('Support ticket sent successfully. Our team will email you.');
                      setShowToast(true);
                    }}
                    variant="primary" 
                    size="sm"
                  >
                    Submit Support Ticket
                  </Button>
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
