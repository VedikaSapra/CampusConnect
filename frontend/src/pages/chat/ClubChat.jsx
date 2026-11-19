import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  Send, Users, MessageSquare, Paperclip, Smile, 
  Search, Shield, Check, CheckCheck, Clock, ChevronRight, X
} from 'lucide-react';
import { Badge, Button } from '../../components/common/UIComponents';

export const ClubChat = () => {
  const { user, tokens } = useAuth();
  const { toast } = useNotification();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Fetch authorized rooms
  const fetchRooms = async () => {
    try {
      const res = await api.get('/chat/rooms/');
      const data = res.data.results || res.data;
      setRooms(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !activeRoom) {
        setActiveRoom(data[0]);
      }
    } catch (err) {
      console.error('Failed to load chat rooms', err);
      toast.error('Unable to fetch authorized club chats.');
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // 2. Fetch history & members when active room switches
  useEffect(() => {
    if (!activeRoom) return;

    const fetchHistoryAndMembers = async () => {
      setLoadingMessages(true);
      try {
        const [historyRes, membersRes] = await Promise.all([
          api.get(`/chat/rooms/${activeRoom.id}/messages/`),
          api.get(`/chat/rooms/${activeRoom.id}/members/`),
        ]);
        setMessages(historyRes.data.results || historyRes.data || []);
        setMembers(membersRes.data.results || membersRes.data || []);
      } catch (err) {
        console.error('Failed to load room details', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchHistoryAndMembers();
  }, [activeRoom?.id]);

  // 3. Connect WebSocket for active room with JWT auth
  useEffect(() => {
    if (!activeRoom || !tokens?.access) return;

    // Connect WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//127.0.0.1:8000/ws/chat/${activeRoom.id}/?token=${tokens.access}`;
    
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to club chat #${activeRoom.id}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          setMessages((prev) => [...prev, data.message]);
        } else if (data.type === 'user_typing') {
          setPartnerTyping(data.user.name);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setPartnerTyping(null);
          }, 2500);
        }
      } catch (err) {
        console.error('Error handling websocket payload', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket connection error', err);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed code:', event.code);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [activeRoom?.id, tokens?.access]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  // 4. Send message handler
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'send_message',
        content: inputText.trim()
      }));
      setInputText('');
    } else {
      // Fallback to REST API
      api.post(`/chat/rooms/${activeRoom.id}/messages/`, { content: inputText.trim() })
        .then((res) => {
          setMessages((prev) => [...prev, res.data]);
          setInputText('');
        })
        .catch(() => toast.error('Failed to deliver message.'));
    }
  };

  // Typing broadcast
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!isTyping && socketRef.current?.readyState === WebSocket.OPEN) {
      setIsTyping(true);
      socketRef.current.send(JSON.stringify({ action: 'typing' }));
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  // Attachment upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('content', `Shared a file: ${file.name}`);

    try {
      const res = await api.post(`/chat/rooms/${activeRoom.id}/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages((prev) => [...prev, res.data]);
      toast.success('File shared successfully!');
    } catch (err) {
      toast.error('Failed to upload file.');
    }
  };

  const filteredRooms = rooms.filter(r => 
    r.club_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8.5rem)] bg-white dark:bg-[#1E1833] rounded-3xl border border-[#E9E5F2] dark:border-purple-900/40 shadow-xs flex overflow-hidden">
      
      {/* ================= LEFT PANEL: Conversation List ================= */}
      <div className="w-80 border-r border-[#E9E5F2] dark:border-purple-900/30 flex flex-col bg-[#F8F7FC] dark:bg-purple-950/20">
        
        {/* Search */}
        <div className="p-4 border-b border-[#E9E5F2] dark:border-purple-900/30">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search club groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-[#251E3E] border border-[#E9E5F2] dark:border-purple-900/40 focus:ring-2 focus:ring-[#8B5CF6] outline-none"
            />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-purple-900/20 custom-scrollbar">
          {loadingRooms ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading club communities...</div>
          ) : filteredRooms.length > 0 ? (
            filteredRooms.map((r) => {
              const isSelected = activeRoom?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setActiveRoom(r)}
                  className={`p-4 flex items-center space-x-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#F3EEFF] dark:bg-purple-900/40 border-l-4 border-[#8B5CF6]'
                      : 'hover:bg-white/60 dark:hover:bg-purple-950/30'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#34246F] to-[#8B5CF6] text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                    {r.club_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-[#211B35] dark:text-white truncate">
                        {r.club_name}
                      </p>
                      {r.last_message && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(r.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#77738B] dark:text-slate-400 truncate mt-0.5">
                      {r.last_message ? `${r.last_message.sender_name}: ${r.last_message.content}` : `${r.member_count} members enrolled`}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No approved club memberships found. Join clubs from Explore Clubs to unlock group chats!
            </div>
          )}
        </div>
      </div>

      {/* ================= CENTER PANEL: Chat Messages ================= */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#1E1833]">
        {activeRoom ? (
          <>
            {/* Top Chat Header */}
            <div className="p-4 px-6 border-b border-[#E9E5F2] dark:border-purple-900/30 flex justify-between items-center bg-white dark:bg-[#1E1833]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F3EEFF] text-[#5141B8] font-bold flex items-center justify-center text-sm">
                  {activeRoom.club_name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#211B35] dark:text-white leading-tight">
                    {activeRoom.club_name} Community
                  </h3>
                  <p className="text-[11px] text-[#27A66B] flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#27A66B]" />
                    <span>Live Channel • {members.length} members</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRightPanel(!showRightPanel)}
                className="p-2 text-slate-400 hover:text-[#5141B8] rounded-xl hover:bg-[#F3EEFF] transition-colors"
                title="Toggle Group Information"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-[#FAF9FD] dark:bg-[#171226]">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : messages.length > 0 ? (
                messages.map((m) => {
                  const isMine = m.sender === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-slate-400">
                        <span className="font-bold text-[#5141B8] dark:text-purple-300">
                          {isMine ? 'You' : m.sender_name}
                        </span>
                        {m.sender_role === 'club_admin' && (
                          <Badge variant="electric" size="xs">OFFICER</Badge>
                        )}
                        <span>•</span>
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isMine
                            ? 'bg-gradient-to-r from-[#5141B8] to-[#8B5CF6] text-white rounded-tr-xs'
                            : 'bg-white dark:bg-[#251E3E] text-[#211B35] dark:text-white rounded-tl-xs border border-[#E9E5F2] dark:border-purple-900/40'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        {m.attachment_url && (
                          <div className="mt-2 pt-2 border-t border-white/20">
                            <a
                              href={m.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] underline font-bold"
                            >
                              Download Attached File
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-xs text-slate-400">
                  No messages yet. Send the first message to introduce yourself to {activeRoom.club_name}!
                </div>
              )}

              {/* Typing indicator */}
              {partnerTyping && (
                <div className="text-[11px] italic text-[#8B5CF6] flex items-center space-x-1">
                  <span>{partnerTyping} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3.5 px-6 border-t border-[#E9E5F2] dark:border-purple-900/30 flex items-center space-x-3 bg-white dark:bg-[#1E1833]">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-[#5141B8] rounded-xl hover:bg-[#F3EEFF] transition-colors"
                title="Attach Document or Image"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder={`Message #${activeRoom.club_name}...`}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-[#F8F7FC] dark:bg-purple-950/30 border border-[#E9E5F2] dark:border-purple-900/40 focus:ring-2 focus:ring-[#8B5CF6] outline-none text-[#211B35] dark:text-white"
              />

              <Button size="sm" type="submit" icon={Send}>
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Select a club group from the left panel to join the conversation.
          </div>
        )}
      </div>

      {/* ================= RIGHT PANEL: Group Info & Members ================= */}
      {showRightPanel && activeRoom && (
        <div className="w-72 border-l border-[#E9E5F2] dark:border-purple-900/30 bg-[#F8F7FC] dark:bg-purple-950/20 p-6 flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
          
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#34246F] to-[#8B5CF6] text-white font-extrabold flex items-center justify-center text-2xl shadow-md">
              {activeRoom.club_name[0]}
            </div>
            <h4 className="text-sm font-extrabold text-[#211B35] dark:text-white">
              {activeRoom.club_name}
            </h4>
            <Badge variant="primary" size="xs">{activeRoom.club_category}</Badge>
            <p className="text-xs text-[#77738B] dark:text-slate-400 line-clamp-3 leading-relaxed mt-2">
              {activeRoom.club_description}
            </p>
          </div>

          <div className="border-t border-[#E9E5F2] dark:border-purple-900/30 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Members ({members.length})
              </span>
              <span className="text-[10px] text-[#27A66B] font-bold">Approved</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {members.map((mem) => (
                <div key={mem.id} className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-white/60 dark:hover:bg-purple-950/40">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#5141B8] to-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs">
                    {mem.full_name?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#211B35] dark:text-white truncate">
                      {mem.full_name}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">
                      {mem.role?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
