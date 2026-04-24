import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, joinRoom } from '../lib/api';

export default function RoomLobby() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomConfig, setRoomConfig] = useState({
    maxPlayers: 4,
    isPrivate: false,
    password: '',
    expansion: 'PHB基础',
    campaign: '费伦大陆：被遗忘的国度'
  });
  
  const [joinId, setJoinId] = useState('');
  const [joinWord, setJoinWord] = useState('');

  const handleCreateRoom = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const room = await createRoom({
        maxPlayers: Number(roomConfig.maxPlayers) || 4,
        isPrivate: roomConfig.isPrivate,
        password: roomConfig.password || '',
        expansion: roomConfig.expansion,
        campaign: roomConfig.campaign
      });
      navigate(`/room/${room.id}`, {
        state: {
          joinedByCreate: true,
          joinWord: roomConfig.password || ''
        }
      });
    } catch (error) {
      alert(error?.message || '创建房间失败，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = async () => {
    if(!joinId.trim()) {
      alert("必须出示战役信标（房间ID）！");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const roomId = joinId.trim().toUpperCase();
      await joinRoom(roomId, joinWord);
      navigate(`/room/${roomId}`, {
        state: {
          joinedByCreate: false,
          joinWord
        }
      });
    } catch (error) {
      alert(error?.message || '加入房间失败，请检查房间号和口令。');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in text-dnd-dark">
      <div className="panel-dnd p-8">
        <h2 className="text-3xl font-bold font-cinzel text-center mb-6 border-b border-dnd-gold-dark pb-2">缔造战役位面</h2>
        <div className="space-y-6">
          <div className="flex flex-col">
            <label className="font-bold mb-2">同行者上限</label>
            <input 
              type="number" min="2" max="10"
              value={roomConfig.maxPlayers} 
              onChange={e => setRoomConfig({...roomConfig, maxPlayers: e.target.value})} 
              className="input-dnd p-3 font-cinzel text-lg" 
            />
          </div>

          <div className="flex flex-col">
            <label className="font-bold mb-2">位面设定 (剧情背景)</label>
            <input 
              type="text" 
              value={roomConfig.campaign} 
              onChange={e => setRoomConfig({...roomConfig, campaign: e.target.value})} 
              className="input-dnd p-3" 
              placeholder="例如：斯特拉德的诅咒、龙枪编年史..."
            />
            <p className="text-xs mt-2 opacity-80 italic">神祇(AI DM) 将据此织就你们的传说。</p>
          </div>

          <div className="flex flex-col">
            <label className="font-bold mb-2">法典限制 (扩展书)</label>
            <select 
              value={roomConfig.expansion} 
              onChange={e => setRoomConfig({...roomConfig, expansion: e.target.value})} 
              className="input-dnd p-3"
            >
              <option value="PHB基础">初阶法则 (仅玩家手册 PHB)</option>
              <option value="塔莎+赞娜塔">进阶法则 (含塔莎的万事锅与赞娜塔指南)</option>
              <option value="全部扩展">混沌同盟 (允许一切官方典籍)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 mt-4 bg-[#e0d3b6] p-4 rounded border border-dnd-gold-dark border-dashed">
            <input 
              type="checkbox" 
              id="isPrivate"
              checked={roomConfig.isPrivate} 
              onChange={e => setRoomConfig({...roomConfig, isPrivate: e.target.checked})} 
              className="w-5 h-5 accent-dnd-red"
            />
            <label htmlFor="isPrivate" className="font-bold select-none cursor-pointer">设下结界 (加密房间)</label>
          </div>
          
          {roomConfig.isPrivate && (
            <div className="pl-8 transition-all animate-fade-in text-dnd-dark">
              <input 
                type="text" 
                placeholder="在此刻下咒语 (6位密码)..." 
                className="input-dnd p-3 w-full" 
                onChange={e => setRoomConfig({...roomConfig, password: e.target.value})} 
              />
            </div>
          )}
          
          <button 
            onClick={handleCreateRoom} 
            disabled={isSubmitting}
            className="btn-dnd w-full py-4 text-xl tracking-widest mt-4"
          >
            {isSubmitting ? '咒文构筑中...' : '宣告降生'}
          </button>
        </div>
      </div>
      
      <div className="panel-dnd p-8 relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-dnd-red/10 rounded-full blur-2xl"></div>
        <h2 className="text-3xl font-bold font-cinzel mb-6 border-b border-dnd-gold-dark pb-2 relative z-10">响应信标</h2>
        <div className="flex flex-col gap-4 relative z-10">
          <input 
            type="text" 
            placeholder="注视星界中的信标 (输入房间 ID)" 
            value={joinId}
            onChange={e => setJoinId(e.target.value)}
            className="input-dnd p-3 uppercase font-cinzel text-lg tracking-widest text-center" 
          />
          <input 
            type="text" 
            placeholder="真言 (如被加密则必填)" 
            value={joinWord}
            onChange={e => setJoinWord(e.target.value)}
            className="input-dnd p-3 text-center" 
          />
          <button 
            onClick={handleJoinRoom}
            disabled={isSubmitting}
            className="btn-dnd py-4 text-xl tracking-widest"
          >
            {isSubmitting ? '正在穿越位面...' : '踏入传送门'}
          </button>
        </div>
      </div>
    </div>
  );
}