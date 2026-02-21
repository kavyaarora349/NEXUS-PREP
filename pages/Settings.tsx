
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Save, 
  Smartphone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle2
} from 'lucide-react';

interface SettingsProps {
  user: { name: string; university: string; semester: string; theme?: string };
  onUpdateUser: (user: { name: string; university: string; semester: string; theme?: string }) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user.name,
    university: user.university,
    semester: user.semester,
    email: 'kavya@reva.edu.in',
    notifications: {
      emailAlerts: true,
      paperReady: true,
      systemUpdates: false
    },
    appearance: {
      theme: user.theme || 'Dark',
      pdfTemplate: 'Standard Academic'
    }
  });

  const handleSave = () => {
    // Pass current local choices back to global state
    onUpdateUser({
      name: formData.name,
      university: formData.university,
      semester: formData.semester,
      theme: formData.appearance.theme // Persist theme change
    });
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections = [
    { id: 'profile', icon: User, label: 'Profile Settings' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'appearance', icon: Palette, label: 'Appearance' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-6"
          >
            <h3 className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" /> General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">University</label>
                <input 
                  type="text" 
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Current Semester</label>
                <select 
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  className="w-full bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n.toString()}>Semester {n}</option>)}
                </select>
              </div>
            </div>
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-6"
          >
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" /> Notification Preferences
            </h3>
            <div className="space-y-4">
              {[
                { id: 'emailAlerts', label: 'Email Alerts', desc: 'Receive security alerts and account activity notifications.' },
                { id: 'paperReady', label: 'Paper Ready', desc: 'Get notified as soon as your question paper is ready.' },
                { id: 'systemUpdates', label: 'System Updates', desc: 'Receive news about new features and improvements.' }
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
                  <div>
                    <p className="font-semibold text-gray-200">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <button 
                    onClick={() => setFormData({
                      ...formData,
                      notifications: { ...formData.notifications, [item.id]: !formData.notifications[item.id as keyof typeof formData.notifications] }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.notifications[item.id as keyof typeof formData.notifications] ? 'bg-indigo-600' : 'bg-gray-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.notifications[item.id as keyof typeof formData.notifications] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 'security':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-8"
          >
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" /> Password Management
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Current Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 outline-none" 
                      placeholder="••••••••"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">New Password</label>
                    <input type="password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Confirm New Password</label>
                    <input type="password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/20">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-400 mt-1">Add an extra layer of security to your account. We'll send a code to your mobile device.</p>
                  <button className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'appearance':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="space-y-8"
          >
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-400" /> Interface Customization
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {['Light', 'Dark'].map((t) => (
                  <button 
                    key={t}
                    onClick={() => {
                      setFormData({ ...formData, appearance: { ...formData.appearance, theme: t } });
                      // Live preview: apply class to body immediately for feedback
                      document.body.className = `theme-${t}`;
                    }}
                    className={`p-4 rounded-2xl border transition-all text-left ${formData.appearance.theme === t ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20' : 'glass border-white/5 hover:bg-white/5'}`}
                  >
                    <div className={`w-full h-12 rounded-lg mb-3 ${t === 'Light' ? 'bg-white' : 'bg-gray-800'}`} />
                    <span className={`text-sm font-bold ${formData.appearance.theme === t ? 'text-white' : ''}`}>{t} Mode</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-white/5">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Save className="w-5 h-5 text-indigo-400" /> Default PDF Output
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between group cursor-pointer">
                  <div>
                    <p className="font-medium group-hover:text-indigo-400 transition-colors">PDF Style Template</p>
                    <p className="text-sm text-gray-500">Choose the institutional branding style for exports.</p>
                  </div>
                  <select 
                    value={formData.appearance.pdfTemplate}
                    onChange={(e) => setFormData({ ...formData, appearance: { ...formData.appearance, pdfTemplate: e.target.value } })}
                    className="bg-[#030712] border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none"
                  >
                    <option>Standard Academic</option>
                    <option>Minimal Modern</option>
                    <option>Classic REVA</option>
                  </select>
                </label>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <header>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-gray-400 mt-1">Manage your profile, security, and interface preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-1">
          {sections.map((s) => (
            <button 
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === s.id ? 'bg-white/10 text-white shadow-xl' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <s.icon className={`w-4 h-4 ${activeSection === s.id ? 'text-indigo-400' : ''}`} />
              {s.label}
            </button>
          ))}
        </aside>

        <div className="md:col-span-3 space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-white/5 flex flex-col min-h-[500px]">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {renderContent()}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between pt-10 mt-10 border-t border-white/5">
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {saved && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Settings updated
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95 shadow-xl shadow-white/5"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
