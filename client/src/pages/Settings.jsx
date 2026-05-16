import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Settings() {
  const { isDark, toggle } = useDarkMode();
  const { user } = useAuth();
  const navigate = useNavigate();

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

      <div className="text-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors inline-flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
