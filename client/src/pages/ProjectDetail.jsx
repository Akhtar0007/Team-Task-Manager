import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projects, tasks, filesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const statusOptions = ['TODO', 'IN_PROGRESS', 'DONE'];
const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const statusBadge = {
  TODO: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  DONE: 'bg-green-100 text-green-800',
};

const priorityBadge = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');

  const [editingTask, setEditingTask] = useState(null);

  const fetchProject = async () => {
    try {
      const { data } = await projects.getById(id);
      setProject(data);
      const myMembership = data.members.find(m => m.user.id === user?.id);
      setIsAdmin(user?.role === 'SUPER_ADMIN' || myMembership?.role === 'ADMIN');
    } catch (err) {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await tasks.create(id, taskForm);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
      setShowTaskForm(false);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await tasks.update(taskId, updates);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasks.delete(taskId);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await projects.addMember(id, { email: memberEmail, role: memberRole });
      setMemberEmail('');
      setMemberRole('MEMBER');
      setShowMemberForm(false);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await projects.removeMember(id, memberId);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleFileUpload = async (taskId, file) => {
    try {
      await filesApi.upload(taskId, file);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload file');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Delete this file?')) return;
    try {
      await filesApi.delete(fileId);
      fetchProject();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete file');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this entire project? This cannot be undone.')) return;
    try {
      await projects.delete(id);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

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

  if (!project) {
    return <div className="text-gray-500 text-center py-10">Project not found</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/projects')} className="text-sm text-indigo-600 hover:underline mb-1">&larr; Back to Projects</button>
          <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
          {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
        </div>
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button onClick={handleDeleteProject} className="text-red-600 text-sm hover:underline">Delete Project</button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Tasks ({project.tasks.length})</h2>
            {isAdmin && (
              <button
                onClick={() => setShowTaskForm(true)}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                + Add Task
              </button>
            )}
          </div>

          {showTaskForm && (
            <form onSubmit={handleCreateTask} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
              <h3 className="font-medium text-gray-800 mb-4">New Task</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Task title *"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={taskForm.assigneeId}
                    onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {project.members.map(m => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setShowTaskForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Create Task</button>
              </div>
            </form>
          )}

          {project.tasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-400">No tasks yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {project.tasks.map(task => (
                <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-800">{task.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge[task.status]}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityBadge[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        {task.assignee && <span>Assigned to: <span className="font-medium">{task.assignee.name}</span></span>}
                        {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                        <span>Created by: {task.createdBy.name}</span>
                      </div>

                      {task.files && task.files.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-2">Attachments</p>
                          <div className="space-y-1">
                            {task.files.map(file => (
                              <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                                <a
                                  href={`/uploads/${file.path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-600 hover:underline truncate"
                                >
                                  {file.name}
                                </a>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                  <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)}KB</span>
                                  {isAdmin && (
                                    <button onClick={() => handleDeleteFile(file.id)} className="text-red-500 text-xs hover:underline">Del</button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-2">
                          <label className="cursor-pointer text-xs text-indigo-600 hover:underline">
                            + Attach file
                            <input
                              type="file"
                              className="hidden"
                              onChange={e => {
                                if (e.target.files[0]) {
                                  handleFileUpload(task.id, e.target.files[0]);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      {editingTask === task.id ? (
                        <select
                          value={task.status}
                          onChange={e => {
                            handleUpdateTask(task.id, { title: task.title, status: e.target.value });
                            setEditingTask(null);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      ) : (
                        <button onClick={() => setEditingTask(task.id)} className="text-indigo-600 text-sm hover:underline">Update</button>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleDeleteTask(task.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Members ({project.members.length})</h2>
              {isSuperAdmin && (
                <button onClick={() => setShowMemberForm(true)} className="text-indigo-600 text-sm font-medium hover:underline">+ Add</button>
              )}
            </div>

            {showMemberForm && (
              <form onSubmit={handleAddMember} className="mb-4 space-y-2">
                <input
                  type="email"
                  placeholder="Member email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <div className="flex space-x-2">
                  <select
                    value={memberRole}
                    onChange={e => setMemberRole(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm">Add</button>
                  <button type="button" onClick={() => setShowMemberForm(false)} className="text-gray-500 text-sm">Cancel</button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {project.members.map(member => (
                <div key={member.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{member.user.name}</p>
                    <p className="text-xs text-gray-400">{member.user.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      member.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {member.role}
                    </span>
                    {isSuperAdmin && member.role !== 'ADMIN' && (
                      <button onClick={() => handleRemoveMember(member.id)} className="text-red-500 text-xs hover:underline">Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
