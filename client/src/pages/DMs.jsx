import { useState, useEffect, useRef } from 'react';
import { dm, users } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DMs() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data } = await dm.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const getOtherParticipant = (conv) => {
    return conv.participant1.id === user?.id ? conv.participant2 : conv.participant1;
  };

  const openConversation = async (conv) => {
    setActiveConv(conv);
    setMessages([]);
    try {
      const { data } = await dm.getMessages(conv.id);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || sending || !activeConv) return;
    setSending(true);
    try {
      const { data } = await dm.sendMessage(activeConv.id, content.trim());
      setMessages(prev => [...prev, data]);
      setContent('');
      fetchConversations();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeConv) return;
    const interval = setInterval(async () => {
      try {
        const since = messages.length > 0 ? messages[messages.length - 1].createdAt : undefined;
        const { data } = await dm.getMessages(activeConv.id, since);
        if (data.length > 0) {
          setMessages(prev => {
            const existing = new Set(prev.map(m => m.id));
            return [...prev, ...data.filter(m => !existing.has(m.id))];
          });
        }
      } catch (err) { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeConv, messages.length]);

  const handleNewConversation = async (userId) => {
    try {
      const { data } = await dm.startOrGetConversation(userId);
      setShowNew(false);
      setSearchTerm('');
      fetchConversations();
      openConversation(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start conversation');
    }
  };

  const handleOpenNew = () => {
    setShowNew(true);
    setAllUsers([]);
    setSearchTerm('');
  };

  useEffect(() => {
    if (!showNew || !searchTerm.trim()) {
      setAllUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await users.search(searchTerm);
        setAllUsers(data.filter(u => u.id !== user?.id));
      } catch (err) {
        console.error('Failed to search users');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, showNew]);

  const filteredUsers = allUsers;

  const roleBadge = (role) => {
    if (role === 'SUPER_ADMIN') return 'bg-yellow-100 text-yellow-800';
    if (role === 'ADMIN') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Conversation List */}
      <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Messages</h2>
          <button onClick={handleOpenNew} className="text-indigo-600 text-sm font-medium hover:underline">+ New</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 italic">No conversations yet</p>
          ) : (
            conversations.map(conv => {
              const other = getOtherParticipant(conv);
              const lastMsg = conv.messages?.[0];
              return (
                <div
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 ${activeConv?.id === conv.id ? 'bg-indigo-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{other.name}</p>
                    {lastMsg && <p className="text-[10px] text-gray-400">{new Date(lastMsg.createdAt).toLocaleDateString()}</p>}
                  </div>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className={`px-1 py-0.5 text-[10px] font-medium rounded ${roleBadge(other.role)}`}>
                      {other.role === 'SUPER_ADMIN' ? 'SA' : other.role === 'ADMIN' ? 'A' : 'M'}
                    </span>
                    {lastMsg && <p className="text-xs text-gray-500 truncate">{lastMsg.content}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
        {activeConv ? (
          <>
            <div className="p-4 border-b border-gray-100">
              <p className="font-semibold text-gray-800">{getOtherParticipant(activeConv).name}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8 italic">Start a conversation</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.user.id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${msg.user.id === user?.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg px-4 py-2`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-0.5 ${msg.user.id === user?.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" disabled={!content.trim() || sending} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400">Select a conversation or start a new one</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-xl p-6 w-96 max-h-[60vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 mb-3">New Message</h3>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <div className="space-y-1">
              {filteredUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => handleNewConversation(u.id)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <span className="text-sm font-medium text-gray-700">{u.name}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${roleBadge(u.role)}`}>{u.role}</span>
                </div>
              ))}
              {filteredUsers.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No users found</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
