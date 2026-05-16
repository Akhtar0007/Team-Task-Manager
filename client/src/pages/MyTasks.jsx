import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasks } from '../api/client';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
  { key: 'TODO', label: 'To Do', color: 'border-yellow-400', bg: 'bg-yellow-50' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-indigo-400', bg: 'bg-indigo-50' },
  { key: 'REVIEW', label: 'Review', color: 'border-orange-400', bg: 'bg-orange-50' },
  { key: 'DONE', label: 'Done', color: 'border-green-400', bg: 'bg-green-50' },
];

const statusBadge = {
  TODO: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  REVIEW: 'bg-orange-100 text-orange-800',
  DONE: 'bg-green-100 text-green-800',
};

const priorityBadge = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function MyTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [tasksList, setTasksList] = useState([]);
  const [columns, setColumns] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      if (view === 'board') {
        const { data } = await tasks.myKanban();
        setColumns(data);
      } else {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        const { data } = await tasks.my(params);
        setTasksList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [view, statusFilter]);

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await tasks.update(taskId, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleQuickStatus = async (taskId, newStatus) => {
    try {
      await tasks.update(taskId, { status: newStatus });
      setTasksList(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedTasks.size === 0) return;
    if (!window.confirm(`Update ${selectedTasks.size} task(s) to ${bulkStatus}?`)) return;
    try {
      for (const id of selectedTasks) {
        await tasks.update(id, { status: bulkStatus });
      }
      setSelectedTasks(new Set());
      setBulkStatus('');
      fetchTasks();
    } catch (err) {
      alert('Failed to update some tasks');
    }
  };

  const toggleSelect = (id) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = (task, fromCol) => {
    setDraggedTask({ ...task, fromColumn: fromCol });
  };

  const handleDrop = async (toCol) => {
    if (!draggedTask || draggedTask.fromColumn === toCol) {
      setDraggedTask(null);
      setDragOverColumn(null);
      return;
    }
    try {
      await tasks.update(draggedTask.id, { status: toCol });
      setColumns(prev => {
        const next = { ...prev };
        next[draggedTask.fromColumn] = next[draggedTask.fromColumn].filter(t => t.id !== draggedTask.id);
        next[toCol] = [{ ...draggedTask, status: toCol }, ...next[toCol]];
        return next;
      });
    } catch (err) {
      alert('Failed to move task');
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  if (loading && !tasksList.length && !columns) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {view === 'list' ? `${tasksList.length} task${tasksList.length !== 1 ? 's' : ''}` : `${Object.values(columns || {}).flat().length} tasks`}
          </p>
        </div>
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${view === 'list' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            List
          </button>
          <button
            onClick={() => setView('board')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${view === 'board' ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Board
          </button>
        </div>
      </div>

      {view === 'list' && (
        <>
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input-field !py-2 !w-auto text-sm"
            >
              <option value="">All status</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
            </select>

            {selectedTasks.size > 0 && (
              <div className="flex items-center space-x-2 ml-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-3 py-1.5">
                <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{selectedTasks.size} selected</span>
                <select
                  value={bulkStatus}
                  onChange={e => setBulkStatus(e.target.value)}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <option value="">Set status...</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </select>
                <button
                  onClick={handleBulkUpdate}
                  disabled={!bulkStatus}
                  className="btn-primary !py-1.5 !px-3"
                >
                  Apply
                </button>
                <button onClick={() => setSelectedTasks(new Set())} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Clear</button>
              </div>
            )}
          </div>

          {tasksList.length === 0 ? (
            <div className="text-center py-16 card card-dark">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No tasks assigned to you</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasksList.map(task => (
                <div key={task.id} className="card card-dark p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleSelect(task.id)}
                        className="mt-1 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <button
                            onClick={() => navigate(`/projects/${task.projectId}?task=${task.id}`)}
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate transition-colors"
                          >
                            {task.title}
                          </button>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge[task.status] || statusBadge.TODO}`}>
                            {task.status?.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityBadge[task.priority] || priorityBadge.MEDIUM}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center space-x-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span>{task.project?.name}</span>
                          </span>
                          {task.dueDate && (
                            <span className={`flex items-center space-x-1 ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500 dark:text-red-400 font-medium' : ''}`}>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                            </span>
                          )}
                          {task.subtasks?.length > 0 && (
                            <span className="flex items-center space-x-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                            </span>
                          )}
                          {task.timeEntries?.length > 0 && (
                            <span className="flex items-center space-x-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{task.timeEntries.reduce((s, e) => s + e.hours, 0).toFixed(1)}h</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <select
                      value={task.status}
                      onChange={e => handleQuickStatus(task.id, e.target.value)}
                      className="ml-4 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'board' && (
        <div className="grid grid-cols-4 gap-4" style={{ minHeight: '70vh' }}>
          {COLUMNS.map(col => (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.key); }}
              onDrop={() => handleDrop(col.key)}
              className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl border-t-[3px] ${col.color} ${dragOverColumn === col.key ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''} transition-all`}
            >
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{col.label}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 font-medium">
                    {(columns?.[col.key] || []).length}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-3 min-h-[200px]">
                {(columns?.[col.key] || []).map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task, col.key)}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <button
                        onClick={() => navigate(`/projects/${task.projectId}?task=${task.id}`)}
                        className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 text-left leading-tight transition-colors"
                      >
                        {task.title}
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">{task.project?.name}</div>
                    {task.dueDate && (
                      <div className={`text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500 dark:text-red-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                        Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                    {task.timeEntries?.length > 0 && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {task.timeEntries.reduce((s, e) => s + e.hours, 0).toFixed(1)}h
                      </div>
                    )}
                  </div>
                ))}
                {(!columns?.[col.key] || columns[col.key].length === 0) && (
                  <div className="flex items-center justify-center h-24 text-xs text-gray-400 dark:text-gray-600 italic border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
