import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import NotificationsDropdown from './NotificationsDropdown';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = (path) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      location.pathname === path
        ? 'bg-white/20 text-white shadow-sm'
        : 'text-indigo-100 hover:bg-white/10 hover:text-white'
    }`;

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <nav className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-bold tracking-tight flex items-center space-x-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Task Manager</span>
              </Link>
              <div className="hidden md:flex items-center space-x-1">
                <Link to="/dashboard" className={linkClass('/dashboard')}>
                  Dashboard
                </Link>
                <Link to="/my-tasks" className={linkClass('/my-tasks')}>
                  My Tasks
                </Link>
                <Link to="/projects" className={isActive('/projects') && !location.pathname.includes('/issues') ? 'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-white/20 text-white shadow-sm' : 'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-indigo-100 hover:bg-white/10 hover:text-white'}>
                  Projects
                </Link>
                <Link to="/chat" className={linkClass('/chat')}>
                  Chat
                </Link>
                <Link to="/dm" className={linkClass('/dm')}>
                  DMs
                </Link>
                <Link to="/timesheets" className={linkClass('/timesheets')}>
                  Timesheets
                </Link>
                {user?.role === 'SUPER_ADMIN' && (
                  <Link to="/users" className={linkClass('/users')}>
                    Users
                  </Link>
                )}
                <Link to="/settings" className={linkClass('/settings')}>
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggle}
                className="p-2 text-indigo-100 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <NotificationsDropdown />
              <div className="hidden sm:flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-1.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-indigo-100 font-medium">{user?.name}</span>
                {user?.role === 'SUPER_ADMIN' && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-400 text-yellow-900 rounded-full uppercase tracking-wider">Admin</span>
                )}
                {user?.role === 'ADMIN' && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-green-400 text-green-900 rounded-full uppercase tracking-wider">Admin</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-indigo-100 hover:bg-white/20 hover:text-white transition-all duration-200 flex items-center space-x-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
