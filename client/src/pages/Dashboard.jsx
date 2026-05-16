import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboard } from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await dashboard.getStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center py-10">{error}</div>;
  }

  const statusColor = {
    TODO: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
    REVIEW: 'bg-orange-100 text-orange-800',
    DONE: 'bg-green-100 text-green-800',
  };

  const statCards = [
    { label: 'Total Tasks', value: stats.totalTasks, color: 'bg-blue-500' },
    { label: 'To Do', value: stats.tasksByStatus.TODO, color: 'bg-yellow-500' },
    { label: 'In Progress', value: stats.tasksByStatus.IN_PROGRESS, color: 'bg-indigo-500' },
    { label: 'Review', value: stats.tasksByStatus.REVIEW, color: 'bg-orange-500' },
    { label: 'Completed', value: stats.tasksByStatus.DONE, color: 'bg-green-500' },
    { label: 'Overdue', value: stats.overdueCount, color: 'bg-red-500' },
    { label: 'My Tasks', value: stats.myTaskCount, color: 'bg-purple-500' },
    { label: 'My Overdue', value: stats.myOverdueCount, color: 'bg-pink-500' },
    { label: 'Projects', value: stats.projectCount, color: 'bg-teal-500' },
  ];

  const actionIcon = {
    CREATE: '🟢',
    UPDATE: '🔵',
    DELETE: '🔴',
    DELETE_USER: '🔴',
    UPDATE_ROLE: '🟡',
    ADD_MEMBER: '🟢',
    REMOVE_MEMBER: '🔴',
    UPLOAD: '📎',
    SIGNUP: '🎉',
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user?.name}</p>
        </div>
        <Link to="/my-tasks" className="btn-primary">
          View My Tasks
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card card-dark p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className={`w-2 h-2 rounded-full ${card.color}`} />
              <span className="text-lg font-bold text-gray-900 dark:text-white">{card.value}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-5 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5">
            <p className="text-sm text-indigo-100 font-medium">Total Users</p>
            <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl p-5 text-white shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-200 hover:-translate-y-0.5">
            <p className="text-sm text-green-100 font-medium">Total Projects</p>
            <p className="text-3xl font-bold mt-1">{stats.totalProjects}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-700 rounded-xl p-5 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5">
            <p className="text-sm text-indigo-100 font-medium">Total Tasks</p>
            <p className="text-3xl font-bold mt-1">{stats.totalTasks}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-700 rounded-xl p-5 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-200 hover:-translate-y-0.5">
            <p className="text-sm text-amber-100 font-medium">Overdue Tasks</p>
            <p className="text-3xl font-bold mt-1">{stats.overdueCount}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {stats.myTasks.length > 0 && (
            <div className="card card-dark p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Tasks</h2>
                <span className="text-xs text-gray-400">{stats.myTasks.length} tasks</span>
              </div>
              <div className="space-y-2">
                {stats.myTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{task.project.name}</p>
                    </div>
                    <span className={`ml-2 px-2.5 py-1 text-xs font-medium rounded-full ${statusColor[task.status]}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSuperAdmin && stats.topPerformers?.length > 0 && (
            <div className="card card-dark p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performers</h2>
              <div className="space-y-2">
                {stats.topPerformers.map((u, i) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{u._count.assignedTasks} done</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {stats.overdueTasks.length > 0 && (
            <div className="card card-dark p-6 border-red-100 dark:border-red-900/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Overdue Tasks</h2>
                <span className="text-xs text-red-500 font-medium">{stats.overdueTasks.length} overdue</span>
              </div>
              <div className="space-y-2">
                {stats.overdueTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300 truncate">{task.title}</p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {task.project.name} {task.assignee ? `· ${task.assignee.name}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-red-500 dark:text-red-400 ml-2 font-medium">
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSuperAdmin && stats.recentActivities?.length > 0 && (
            <div className="card card-dark p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
              <div className="space-y-1">
                {stats.recentActivities.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                    <span className="text-xs mt-0.5">{actionIcon[log.action] || '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 dark:text-gray-300 truncate">{log.details || `${log.action} ${log.entity}`}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{log.user.name} · {new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSuperAdmin && stats.recentUsers?.length > 0 && (
            <div className="card card-dark p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Signups</h2>
              <div className="space-y-2">
                {stats.recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{u.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {stats.myTasks.length === 0 && stats.overdueTasks.length === 0 && !isSuperAdmin && (
        <div className="text-center py-16 card card-dark">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No tasks yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create a project to get started!</p>
            <Link to="/projects" className="mt-6 inline-flex items-center space-x-2 btn-primary">
              <span>Go to Projects</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
