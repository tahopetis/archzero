import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  User,
  Mail,
  Shield,
  Bell,
  Palette,
  Save,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  defaultView: 'cards' | 'dashboard' | 'relationships';
  itemsPerPage: number;
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'activity'>(
    'profile'
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);

  // Profile form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [emailError, setEmailError] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    emailNotifications: true,
    defaultView: 'cards',
    itemsPerPage: 20,
  });

  // Mock activity history
  const [activityLog] = useState<ActivityLog[]>([
    {
      id: '1',
      action: 'Login',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      details: 'Logged in from Chrome on Windows',
    },
    {
      id: '2',
      action: 'Password Updated',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      details: 'Password changed successfully',
    },
    {
      id: '3',
      action: 'Profile Updated',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      details: 'Updated user information',
    },
    {
      id: '4',
      action: 'Login',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      details: 'Logged in from Firefox on MacOS',
    },
  ]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleProfileSave = async () => {
    setSaveStatus('idle');

    // Validate email
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      setSaveStatus('error');
      return;
    }

    setEmailError('');

    // Update user in store (mock - in real app would call API)
    if (user) {
      const updatedUser = {
        ...user,
        fullName,
        email,
      };
      setUser(updatedUser);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate current password
    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    // Validate new password
    if (!validatePassword(newPassword)) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    // Validate confirmation
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Mock password change (in real app would call API)
    setPasswordSuccess('Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(''), 3000);
  };

  const handlePreferencesSave = () => {
    // Mock preferences save (in real app would call API)
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'architect':
        return 'bg-blue-100 text-blue-800';
      case 'editor':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="profile-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="profile-title">
            User Profile
          </h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow mb-6 p-6" data-testid="user-info-card">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900" data-testid="user-name">
                {user?.fullName || 'Not set'}
              </h2>
              <p className="text-gray-600" data-testid="user-email">
                {user?.email}
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                    user?.role || 'viewer'
                  )}`}
                  data-testid="user-role"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {user?.role || 'viewer'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('profile')}
                data-testid="tab-profile"
                className={`${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center space-x-2`}
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                data-testid="tab-security"
                className={`${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center space-x-2`}
              >
                <Key className="w-4 h-4" />
                <span>Security</span>
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                data-testid="tab-preferences"
                className={`${
                  activeTab === 'preferences'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center space-x-2`}
              >
                <Palette className="w-4 h-4" />
                <span>Preferences</span>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                data-testid="tab-activity"
                className={`${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center space-x-2`}
              >
                <Bell className="w-4 h-4" />
                <span>Activity</span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div data-testid="profile-tab-content">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      data-testid="profile-full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        data-testid="profile-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError('');
                        }}
                        className={`w-full pl-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          emailError ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="you@example.com"
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1 text-sm text-red-600" data-testid="email-error">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    {saveStatus === 'success' && (
                      <div className="flex items-center text-green-600" data-testid="save-success">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm">Changes saved successfully</span>
                      </div>
                    )}
                    {saveStatus === 'error' && (
                      <div className="flex items-center text-red-600" data-testid="save-error">
                        <XCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm">Failed to save changes</span>
                      </div>
                    )}
                    <button
                      onClick={handleProfileSave}
                      data-testid="save-profile-button"
                      className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div data-testid="security-tab-content">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        id="currentPassword"
                        data-testid="current-password"
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        data-testid="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        data-testid="toggle-password-visibility"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      data-testid="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>

                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                      {passwordSuccess}
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      data-testid="change-password-button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2"
                    >
                      <Key className="w-4 h-4" />
                      <span>Change Password</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div data-testid="preferences-tab-content">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Preferences</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <select
                      data-testid="preference-theme"
                      value={preferences.theme}
                      onChange={(e) =>
                        setPreferences({ ...preferences, theme: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default View
                    </label>
                    <select
                      data-testid="preference-default-view"
                      value={preferences.defaultView}
                      onChange={(e) =>
                        setPreferences({ ...preferences, defaultView: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cards">Cards</option>
                      <option value="dashboard">Dashboard</option>
                      <option value="relationships">Relationships</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Items Per Page
                    </label>
                    <select
                      data-testid="preference-items-per-page"
                      value={preferences.itemsPerPage}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          itemsPerPage: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Notifications
                      </label>
                      <p className="text-xs text-gray-500">Receive updates via email</p>
                    </div>
                    <button
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          emailNotifications: !preferences.emailNotifications,
                        })
                      }
                      data-testid="toggle-notifications"
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    {saveStatus === 'success' && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm">Preferences saved</span>
                      </div>
                    )}
                    <button
                      onClick={handlePreferencesSave}
                      data-testid="save-preferences-button"
                      className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Preferences</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div data-testid="activity-tab-content">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Activity History</h3>
                <div className="space-y-4">
                  {activityLog.map((activity) => (
                    <div
                      key={activity.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                      data-testid={`activity-${activity.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900">{activity.action}</h4>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                              {activity.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(activity.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
