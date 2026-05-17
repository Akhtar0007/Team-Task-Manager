import { useState, useEffect } from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import { dashboard } from '../api/client';

export default function Settings() {
  const { isDark, toggle } = useDarkMode();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (isSuperAdmin) {
      dashboard.getStats().then(({ data }) => setStats(data)).catch(() => {});
    }
  }, []);

  const s = stats || {};
  const recentActivities = s.recentActivities || [];
  const recentUsers = s.recentUsers || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your preferences</p>
      </div>

      <div className="card card-dark p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>

        <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark theme across the app</p>
          </div>
          <button
            onClick={toggle}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${isDark ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${isDark ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Account</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            user?.role === 'SUPER_ADMIN' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
            user?.role === 'ADMIN' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'ADMIN' ? 'Admin' : 'Member'}
          </span>
        </div>
      </div>

      {isSuperAdmin && (
        <>
          <div className="card card-dark p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {recentActivities.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 dark:text-gray-300 truncate">{log.details || `${log.action} ${log.entity}`}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{log.user?.name || 'Unknown'} {log.createdAt ? `· ${new Date(log.createdAt).toLocaleString()}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card card-dark p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Signups</h2>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No recent signups</p>
            ) : (
              <div className="space-y-2">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{u.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
