import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [currentUser] = useState(localStorage.getItem('dnd_user') || '神秘旅人');
  const [roomState, setRoomState] = useState('waiting'); // 'waiting' | 'playing'
  
  // --- Waiting Room State ---
  const [mySavedCards, setMySavedCards] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  
  // Fake Multiplayer State (to be replaced by WebSockets)
  const [players, setPlayers] = useState([
    { id: '1', username: currentUser, isReady: false, character: null },
    { id: '2', username: '等待加入...', isReady: false, character: null },
    { id: '3', username: '等待加入...', isReady: false, character: null },
    { id: '4', username: '等待加入...', isReady: false, character: null }
  ]);

  // --- Game State ---
  const [showDrawer, setShowDrawer] = useState(false);
  const [myChar, setMyChar] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [playerInput, setPlayerInput] = useState('');
  const [isWaitingReady, setIsWaitingReady] = useState(false);
  const endOfLogRef = useRef(null);

  useEffect(() => {
    // 拉取玩家在本地保存的所有角色卡（将来从数据库通过 /api/characters/:username 读取）
    const saved = JSON.parse(localStorage.getItem('trpg_characters') || '[]');
    setMySavedCards(saved);
  }, []);

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isWaitingReady, roomState]);

  // 准备/取消准备
  const toggleReady = () => {
    if (!selectedCharId && !isReady) {
      alert("请先在下方选择一张你要出战的角色卡！");
      return;
    }
    
    const nextReady = !isReady;
    setIsReady(nextReady);

    // Mock update player list
    const selectedChar = mySavedCards.find(c => c.id === selectedCharId);
    if(nextReady) {
      setMyChar(selectedChar);
    } else {
      setMyChar(null);
    }

    setPlayers(prev => {
      const next = [...prev];
      next[0] = { ...next[0], isReady: nextReady, character: nextReady ? selectedChar : null };
      return next;
    });
  };

  const handleStartGame = () => {
    if (!isReady) {
      alert("你需要先点击准备就绪！");
      return;
    }
    // TODO: Socket 校验是否所有人 isReady === true
    setRoomState('playing');
    setChatLog([
      { 
        role: 'system', 
        content: `[神谕]：规则约束完毕，所有灵魂已连线。位面 ${roomId} 开始远征！` 
      },
      { 
        role: 'dm', 
        content: `你们穿过雷鸣交加的荒野，最终发现了一处名为「沉睡巨人」的石制旅店。推开门，昏暗的烛光和麦酒的气味扑面而来。旅馆里的人们安静了片刻，老板看着你们这群形形色色的人，警惕地问：“住店还是打酒？” ${myChar ? `他看了看 ${myChar.basic.name} 腰间的武器，皱了皱眉。` : ''}` 
      }
    ]);
  };

  const handleSubmitAction = async () => {
    if (!playerInput.trim()) return;
    
    const playerName = myChar ? myChar.basic?.name : currentUser;
    const newLog = [...chatLog, { role: 'player', name: playerName, content: playerInput }];
    setChatLog(newLog);
    setPlayerInput('');
    setIsWaitingReady(true);

    // 模拟 DM 响应
    setTimeout(() => {
      setChatLog(prev => [...prev, { 
        role: 'dm', 
        content: `旅店老板打量了 ${playerName} 一圈，嘟囔道：“住宿5个铜币。”\n请进行一次 【洞察 (Insight)】 检定！` 
      }]);
      setIsWaitingReady(false);
    }, 2000);
  };

  return (
    <div className="h-[85vh] flex flex-col bg-[#111111] rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.8)] border-2 border-dnd-gold-dark overflow-hidden text-dnd-parchment font-serif relative">
      
      {/* === HEADER === */}
      <div className="bg-gradient-to-r from-[#1a1815] to-[#251b1a] p-4 flex justify-between items-center shadow-lg border-b-2 border-[#8b2b2b] z-20">
        <div className="flex items-center gap-4">
          <span className="font-cinzel text-xl text-dnd-gold font-bold drop-shadow-md">🛡️ 战役坐标: {roomId}</span>
          <span className="text-gray-400 text-sm">| 宿主: {currentUser}</span>
        </div>
        <div className="flex items-center gap-3">
          {roomState === 'playing' && (
            <button 
              onClick={() => setShowDrawer(!showDrawer)}
              className="font-bold border px-4 py-1 rounded transition border-dnd-gold text-dnd-gold hover:bg-dnd-gold hover:text-black shadow-md bg-black/40"
            >
              🔍 查看我的角色卡
            </button>
          )}
          <button 
            className="font-cinzel font-bold border border-red-900 px-4 py-1 rounded hover:bg-red-900 hover:text-white transition text-gray-300" 
            onClick={() => navigate('/lobby')}
          >
            退出战役
          </button>
        </div>
      </div>
      
      {/* =========================================
          WAITING ROOM (准备区)
         ========================================= */}
      {roomState === 'waiting' && (
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：房间玩家列表 */}
          <div className="w-1/3 bg-[#1a1815] border-r-2 border-[#8b2b2b]/50 p-6 flex flex-col">
            <h2 className="text-2xl font-bold font-cinzel text-dnd-gold border-b border-gray-600 pb-2 mb-6">冒险者队伍</h2>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {players.map((p) => (
                <div key={p.id} className="bg-black/40 border border-gray-700 p-3 rounded flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-200">{p.username}</h3>
                    <p className="text-sm text-gray-500">
                      {p.character ? `扮演: ${p.character.basic?.name} (${p.character.basic?.charClass})` : '尚未选择角色'}
                    </p>
                  </div>
                  <div>
                    {p.isReady ? (
                      <span className="bg-green-900 text-green-200 text-xs px-2 py-1 border border-green-700 rounded font-bold">READY</span>
                    ) : (
                      <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 border border-gray-600 rounded font-bold">思考中</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-gray-600 mt-4 text-center">
               <button 
                  onClick={handleStartGame}
                  className="w-full bg-[#8b2b2b] text-white py-3 rounded font-bold tracking-widest font-cinzel hover:bg-red-700 border-2 border-[#e8deb8] shadow-[0_0_10px_rgba(139,43,43,0.8)]"
               >
                 🏁 满员且就绪，即刻发车！
               </button>
               <p className="text-xs text-gray-500 mt-2">（此按钮暂由房主点击生效）</p>
            </div>
          </div>
          
          {/* 右侧：角色卡选择及准备 */}
          <div className="w-2/3 bg-dnd-dark p-6 overflow-y-auto relative">
            <div className="absolute inset-0 pointer-events-none pattern-overlay opacity-10"></div>
            <div className="relative z-10 flex justify-between items-center mb-6 border-b border-dnd-gold-dark pb-2">
              <h2 className="text-2xl font-bold font-cinzel text-dnd-red-dark drop-shadow-sm text-dnd-parchment">我的传承记录 (本服角色库)</h2>
              <button 
                onClick={toggleReady}
                className={`font-bold px-6 py-2 rounded border-2 transition ${isReady ? 'bg-red-800 border-red-500 text-white' : 'bg-green-700 border-green-400 text-white hover:bg-green-600 shadow-lg'}`}
              >
                {isReady ? '✖ 取消准备' : '✔ 锁定出战！'}
              </button>
            </div>
            
            {mySavedCards.length === 0 ? (
               <div className="text-center p-12 bg-black/40 border border-dashed border-gray-600 rounded">
                 <p className="text-gray-400 mb-4">你的灵魂深处空无一物，必须先回到大厅建立并在库中拥有人物卡...</p>
                 <button onClick={() => navigate('/creator')} className="text-dnd-gold hover:underline">← 返回大厅建立</button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                 {mySavedCards.map(c => {
                   const isSelected = selectedCharId === c.id;
                   return (
                     <div 
                        key={c.id} 
                        onClick={() => { if(!isReady) setSelectedCharId(c.id) }}
                        className={`p-4 relative group rounded cursor-pointer transition-all border-2 
                           ${isSelected 
                              ? 'bg-[#e8deb8] border-[#8b2b2b] shadow-[0_0_15px_rgba(139,43,43,0.5)]' 
                              : 'bg-[#f5eedc] border-gray-400 opacity-70 hover:opacity-100 hover:border-dnd-gold'}
                           ${isReady && !isSelected ? 'filter grayscale cursor-not-allowed opacity-30' : ''}`}
                     >
                       {isSelected && <div className="absolute -top-3 -right-3 bg-[#8b2b2b] text-white text-xs font-bold px-2 py-1 rounded shadow-md border border-[#e8deb8]">出阵位</div>}
                       <h3 className="font-bold text-xl mb-1 text-gray-900 border-b border-gray-400 pb-1">{c.basic?.name || "未知"}</h3>
                       <p className="text-xs font-bold text-gray-700 mt-2 mb-2">{c.basic?.race} / {c.basic?.charClass} / Lv {c.basic?.level}</p>
                       <div className="flex flex-wrap gap-1 text-[10px] font-bold text-gray-800">
                         <span className="bg-white/50 border border-gray-400 px-1 rounded">力量 {c.baseStats?.str}</span>
                         <span className="bg-white/50 border border-gray-400 px-1 rounded">敏捷 {c.baseStats?.dex}</span>
                         <span className="bg-white/50 border border-gray-400 px-1 rounded">AC {c.ac}</span>
                         <span className="bg-white/50 border border-gray-400 px-1 rounded">HP {c.hp}</span>
                       </div>
                     </div>
                   );
                 })}
               </div>
            )}
          </div>
        </div>
      )}


      {/* =========================================
          GAME ROOM (游玩区)
         ========================================= */}
      {roomState === 'playing' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col relative bg-parchment-pattern scroll-smooth">
            {chatLog.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[80%] rounded shadow-lg p-4 border border-opacity-30 relative ${
                  msg.role === 'dm' 
                    ? 'bg-gradient-to-br from-[#2a1a1b] to-[#1c1214] text-[#e8deb8] border-[3px] border-dnd-red self-start shadow-[0_5px_15px_rgba(130,36,36,0.3)]' 
                    : msg.role === 'system'
                    ? 'bg-transparent text-dnd-dark self-center text-sm border-none shadow-none filter drop-shadow-none'
                    : 'bg-gradient-to-br from-[#1d273a] to-[#12182b] text-[#e8deb8] border-2 border-dnd-indigo self-end shadow-[0_5px_15px_rgba(30,40,60,0.5)]'
                }`}
              >
                {msg.role === 'dm' && <div className="text-xs font-bold font-cinzel text-dnd-red mb-2 tracking-widest uppercase">地下城主 (AI DM)</div>}
                {msg.role === 'player' && <div className="text-xs font-bold font-cinzel text-blue-400 mb-2 tracking-widest uppercase">{msg.name} {msg.name !== currentUser ? '(队友)' : ''}</div>}
                {msg.role === 'system' && <span className="font-bold text-center block w-full tracking-widest bg-black/20 py-1 rounded text-white">{msg.content}</span>}
                
                {msg.role !== 'system' && (
                  <div className="whitespace-pre-wrap leading-relaxed text-lg text-justify text-gray-200" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>{msg.content}</div>
                )}
              </div>
            ))}
            {isWaitingReady && (
              <div className="self-start text-xs italic opacity-80 tracking-widest max-w-[85%] bg-[#111]/80 px-4 py-2 border border-gray-600 rounded text-dnd-parchment shadow-md">
                ⏳ 正在接收 DM 的天命指引...
              </div>
            )}
            <div ref={endOfLogRef} className="h-4" />
          </div>

          <div className="p-4 bg-gradient-to-b from-[#1a1815] to-[#111] border-t-2 border-dnd-gold-dark flex gap-4 items-end shadow-[0_-10px_20px_rgba(0,0,0,0.9)] z-10">
            <textarea 
              disabled={isWaitingReady}
              value={playerInput}
              onChange={e => setPlayerInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitAction();
                }
              }}
              placeholder="宣告你的意志... (如：拔出长剑对老板威吓，或：向暗处投掷 1d20+3的潜行)" 
              className="border-2 border-dnd-gold-dark bg-[#e8deb8] p-3 flex-grow rounded focus:ring-2 focus:ring-[#8b2b2b] outline-none resize-none min-h-[60px] max-h-[120px] text-[#111] font-bold shadow-inner"
              rows="2"
            />
            <button 
              disabled={isWaitingReady}
              onClick={handleSubmitAction} 
              className="btn-dnd font-cinzel font-bold px-8 py-3 h-full min-h-[60px] text-lg disabled:bg-gray-700 disabled:border-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              行动 / 发送
            </button>
          </div>
        </>
      )}

      {/* =========================================
          侧边栏抽屉: 查看我的角色卡 
         ========================================= */}
      <div 
        className={`absolute top-0 right-0 w-[350px] h-full bg-[#f5eedc] text-[#111] border-l-4 border-[#8b2b2b] shadow-[-10px_0_30px_rgba(0,0,0,0.8)] transform transition-transform duration-300 ease-in-out z-30 ${showDrawer ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="bg-[#8b2b2b] text-[#f5eedc] p-3 flex justify-between items-center shadow-md">
          <h2 className="font-bold text-lg tracking-widest">我的角色简卡</h2>
          <button onClick={() => setShowDrawer(false)} className="text-2xl hover:text-white leading-none">&times;</button>
        </div>
        {myChar ? (
           <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
             <div className="text-center mb-4 border-b border-gray-400 pb-4">
               <h3 className="text-2xl font-bold font-cinzel text-red-900">{myChar.basic?.name}</h3>
               <p className="text-sm font-bold mt-1 text-gray-700">{myChar.basic?.race} | {myChar.basic?.charClass} LV.{myChar.basic?.level}</p>
             </div>
             
             <div className="grid grid-cols-3 gap-2 mb-4">
               <div className="bg-white border border-gray-400 rounded text-center p-2 shadow-sm">
                 <div className="text-xs font-bold text-gray-500">AC</div>
                 <div className="text-xl font-bold text-blue-900">{myChar.ac}</div>
               </div>
               <div className="bg-white border border-gray-400 rounded text-center p-2 shadow-sm">
                 <div className="text-xs font-bold text-gray-500">HP</div>
                 <div className="text-xl font-bold text-red-700">{myChar.hp}</div>
               </div>
               <div className="bg-white border border-gray-400 rounded text-center p-2 shadow-sm">
                 <div className="text-xs font-bold text-gray-500">PB</div>
                 <div className="text-xl font-bold text-gray-800">+{myChar.profBonus}</div>
               </div>
             </div>

             <div className="mb-4">
               <h4 className="font-bold mb-2 bg-[#ded2a5] p-1 border border-gray-400 text-center">基础属性</h4>
               <div className="grid grid-cols-3 gap-1 text-xs text-center font-bold">
                 <div className="border p-1 bg-white">力量: {myChar.baseStats?.str}</div>
                 <div className="border p-1 bg-white">敏捷: {myChar.baseStats?.dex}</div>
                 <div className="border p-1 bg-white">体质: {myChar.baseStats?.con}</div>
                 <div className="border p-1 bg-white">智力: {myChar.baseStats?.int}</div>
                 <div className="border p-1 bg-white">感知: {myChar.baseStats?.wis}</div>
                 <div className="border p-1 bg-white">魅力: {myChar.baseStats?.cha}</div>
               </div>
             </div>

             <div className="mb-4">
               <h4 className="font-bold mb-2 bg-[#ded2a5] p-1 border border-gray-400 text-center">熟练技能 (简略)</h4>
               <div className="text-sm border border-gray-400 p-2 bg-white flex flex-wrap gap-2">
                 {Object.entries(myChar.proficiencies?.skills || {})
                   .filter(([_, isProf]) => isProf)
                   .map(([key]) => <span className="bg-gray-200 px-1 rounded border border-gray-300" key={key}>{key}</span>)
                 }
               </div>
             </div>

             <div>
               <h4 className="font-bold mb-2 bg-[#ded2a5] p-1 border border-gray-400 text-center">携带装备</h4>
               <div className="text-sm whitespace-pre-wrap border border-gray-400 p-2 bg-white min-h-[50px]">
                 {myChar.equipment?.weapons || '（空手）'}
               </div>
             </div>
           </div>
        ) : (
           <div className="p-6 text-center text-gray-500 italic">尚未选择任何角色数据。</div>
        )}
      </div>

    </div>
  );
}import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [currentUser] = useState(localStorage.getItem('dnd_user') || '神秘旅人');
  const [roomState, setRoomState] = useState('waiting'); // 'waiting' | 'playing'
  
  // --- Waiting Room State ---
  const [mySavedCards, setMySavedCards] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  
  // Fake Multiplayer State (to be replaced by WebSockets)
  const [players, setPlayers] = useState([
    { id: '1', username: currentUser, isReady: false, character: null },
    { id: '2', username: '等待加入...', isReady: false, character: null },
    { id: '3', username: '等待加入...', isReady: false, character: null },
    { id: '4', username: '等待加入...', isReady: false, character: null }
  ]);

  // --- Game State ---
  const [showDrawer, setShowDrawer] = useState(false);
  const [myChar, setMyChar] = useState(null);
  const [chatLog, setChatLog] = useState([]);
  const [playerInput, setPlayerInput] = useState('');
  const [isWaitingReady, setIsWaitingReady] = useState(false);
  const endOfLogRef = useRef(null);

  useEffect(() => {
    // 拉取玩家在本地保存的所有角色卡（将来从数据库通过 /api/characters/:username 读取）
    const saved = JSON.parse(localStorage.getItem('trpg_characters') || '[]');
    setMySavedCards(saved);
  }, []);

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isWaitingReady, roomState]);

  // 准备/取消准备
  const toggleReady = () => {
    if (!selectedCharId && !isReady) {
      alert("请先在下方选择一张你要出战的角色卡！");
      return;
    }
    
    const nextReady = !isReady;
    setIsReady(nextReady);

    // Mock update player list
    const selectedChar = mySavedCards.find(c => c.id === selectedCharId);
    if(nextReady) {
      setMyChar(selectedChar);
    } else {
      setMyChar(null);
    }

    setPlayers(prev => {
      const next = [...prev];
      next[0] = { ...next[0], isReady: nextReady, character: nextReady ? selectedChar : null };
      return next;
    });
  };

  const handleStartGame = () => {
    if (!isReady) {
      alert("你需要先点击准备就绪！");
      return;
    }
    // TODO: Socket 校验是否所有人 isReady === true
    setRoomState('playing');
    setChatLog([
      { 
        role: 'system', 
        content: `[神谕]：规则约束完毕，所有灵魂已连线。位面 ${roomId} 开始远征！` 
      },
      { 
        role: 'dm', 
        content: `你们穿过雷鸣交加的荒野，最终发现了一处名为「沉睡巨人」的石制旅店。推开门，昏暗的烛光和麦酒的气味扑面而来。旅馆里的人们安静了片刻，老板看着你们这群形形色色的人，警惕地问：“住店还是打酒？” ${myChar ? `他看了看 ${myChar.basic.name} 腰间的武器，皱了皱眉。` : ''}` 
      }
    ]);
  };

  const handleSubmitAction = async () => {
    if (!playerInput.trim()) return;
    
    const playerName = myChar ? myChar.basic?.name : currentUser;
    const newLog = [...chatLog, { role: 'player', name: playerName, content: playerInput }];
    setChatLog(newLog);
    setPlayerInput('');
    setIsWaitingReady(true);

    // 模拟 DM 响应
    setTimeout(() => {
      setChatLog(prev => [...prev, { 
        role: 'dm', 
        content: `旅店老板打量了 ${playerName} 一圈，嘟囔道：“住宿5个铜币。”
请进行一次 【洞察 (Insight)】 检定！` 
      }]);
      setIsWaitingReady(false);
    }, 2000);
  };

  return (
    <div className="h-[85vh] flex flex-col bg-[#111111] rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.8)] border-2 border-dnd-gold-dark overflow-hidden text-dnd-parchment font-serif relative">
      
      {/* === HEADER === */}
      <div className="bg-gradient-to-r from-[#1a1815] to-[#251b1a] p-4 flex justify-between items-center shadow-lg border-b-2 border-[#8b2b2b] z-20">
        <div className="flex items-center gap-4">
          <span className="font-cinzel text-xl text-dnd-gold font-bold drop-shadow-md">🛡️ 战役坐标: {roomId}</span>
          <span className="text-gray-400 text-sm">| 宿主: {currentUser}</span>
        </div>
        <div className="flex items-center gap-3">
          {roomState === 'playing' && (
            <button 
              onClick={() => setShowDrawer(!showDrawer)}
              className="font-bold border px-4 py-1 rounded transition border-dnd-gold text-dnd-gold hover:bg-dnd-gold hover:text-black shadow-md bg-black/40"
            >
              🔍 查看我的角色卡
            </button>
          )}
          <button 
            className="font-cinzel font-bold border border-red-900 px-4 py-1 rounded hover:bg-red-900 hover:text-white transition text-gray-300" 
            onClick={() => navigate('/lobby')}
          >
            退出战役
          </button>
        </div>
      </div>
      
      {/* =========================================
          WAITING ROOM (准备区)
         ========================================= */}
      {roomState === 'waiting' && (
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：房间玩家列表 */}
          <div className="w-1/3 bg-[#1a1815] border-r-2 border-[#8b2b2b]/50 p-6 flex flex-col">
            <h2 className="text-2xl font-bold font-cinzel text-dnd-gold border-b border-gray-600 pb-2 mb-6">冒险者队伍</h2>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {players.map((p, idx) => (
                <div key={p.id} className="bg-black/40 border border-gray-700 p-3 rounded flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-200">{p.username}</h3>
                    <p className="text-sm text-gray-500">
                      {p.character ? `扮演: ${p.character.basic?.name} (${p.character.basic?.charClass})` : '尚未选择角色'}
                    </p>
                  </div>
                  <div>
                    {p.isReady ? (
                      <span className="bg-green-900 text-green-200 text-xs px-2 py-1 border border-green-700 rounded font-bold">READY</span>
                    ) : (
                      <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 border border-gray-600 rounded font-bold">思考中</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-gray-600 mt-4 text-center">
               <button 
                  onClick={handleStartGame}
                  className="w-full bg-[#8b2b2b] text-white py-3 rounded font-bold tracking-widest font-cinzel hover:bg-red-700 border-2 border-[#e8deb8] shadow-[0_0_10px_rgba(139,43,43,0.8)]"
               >
                 🏁 满员且就绪，即刻发车！
               </button>
               <p className="text-xs text-gray-500 mt-2">（此按钮暂由任何人点击均可生效）</p>
            </div>
          </div>
          
          {/* 右侧：角色卡选择及准备 */}
          <div className="w-2/3 bg-dnd-dark p-6 overflow-y-auto relative">
            <div className="absolute inset-0 pointer-events-none pattern-overlay opacity-10"></div>
            <div className="relative z-10 flex justify-between items-center mb-6 border-b border-dnd-gold-dark pb-2">
              <h2 className="text-2xl font-bold font-cinzel text-dnd-red-dark drop-shadow-sm text-dnd-parchment">我的传承记录 (角色数据库)</h2>
              <button 
                onClick={toggleReady}
                className={`font-bold px-6 py-2 rounded border-2 transition ${isReady ? 'bg-red-800 border-red-500 text-white' : 'bg-green-700 border-green-400 text-white hover:bg-green-600 shadow-lg'}`}
              >
                {isReady ? '✖ 取消准备' : '✔ 锁定出战！'}
              </button>
            </div>
            
            {mySavedCards.length === 0 ? (
               <div className="text-center p-12 bg-black/40 border border-dashed border-gray-600 rounded">
                 <p className="text-gray-400 mb-4">你的灵魂深处空无一物，必须先在角色大厅建立并在库中拥有人物卡...</p>
                 <button onClick={() => navigate('/creator')} className="text-dnd-gold hover:underline">← 返回大厅创建</button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                 {mySavedCards.map(c => {
                   const isSelected = selectedCharId === c.id;
                   return (
                     <div 
                        key={c.id} 
                        onClick={() => { if(!isReady) setSelectedCharId(c.id) }}
                        className={`p-4 relative group rounded cursor-pointer transition-all border-2 
                           ${isSelected 
                              ? 'bg-[#e8deb8] border-[#8b2b2b] shadow-[0_0_15px_rgba(139,43,43,0.5)]' 
                              : 'bg-[#f5eedc] border-gray-400 opacity-70 hover:opacity-100 hover:border-dnd-gold'}
                           ${isReady && !isSelected ? 'filter grayscale cursor-not-allowed opacity-30' : ''}`}
                     >
                       {isSelected && <div className="absolute -top-3 -right-3 bg-[#8b2b2b] text-white text-xs font-bold px-2 py-1 rounded shadow-md border border-[#e8deb8]">出阵位</div>}
                       <h3 className="font-bold text-xl mb-1 text-gray-900 border-b border-gray-400 pb-1">{c.basic?.name || "未知"}</h3>
                       <p className="text-xs font-bold text-gray-700 mt-2 mb-2">{c.basic?.race} / {c.basic?.charClass} / Lv {c.basic?.level}</p>
                       <div className="flex flex-wrap gap-1 text-[10px] font-bold text-gray-800">
                         <span className="bg-white/50 border border-gray-400 px-1 rounded">力量 {c.baseStats?.str}</span>
                         <span className="bg-white/50 border border-gray-400 px-1 rounded">敏捷 {c.baseStats?.dex}</span>
                         <span className="bg-white/50 border border-gray-400 px-1 rounded">AC {c.ac}</span>
                         <span className="bg-white/50 border border-gray-400 px-1 rounded">HP {c.hp}</span>
                       </div>
                     </div>
                   );
                 })}
               </div>
            )}
          </div>
        </div>
      )}


      {/* =========================================
          GAME ROOM (游玩区)
         ========================================= */}
      {roomState === 'playing' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col relative bg-parchment-pattern scroll-smooth">
            {chatLog.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[80%] rounded shadow-lg p-4 border border-opacity-30 relative ${
                  msg.role === 'dm' 
                    ? 'bg-gradient-to-br from-[#2a1a1b] to-[#1c1214] text-[#e8deb8] border-[3px] border-dnd-red self-start shadow-[0_5px_15px_rgba(130,36,36,0.3)]' 
                    : msg.role === 'system'
                    ? 'bg-transparent text-dnd-dark self-center text-sm border-none shadow-none filter drop-shadow-none'
                    : 'bg-gradient-to-br from-[#1d273a] to-[#12182b] text-[#e8deb8] border-2 border-dnd-indigo self-end shadow-[0_5px_15px_rgba(30,40,60,0.5)]'
                }`}
              >
                {msg.role === 'dm' && <div className="text-xs font-bold font-cinzel text-dnd-red mb-2 tracking-widest uppercase">地下城主 (AI DM)</div>}
                {msg.role === 'player' && <div className="text-xs font-bold font-cinzel text-blue-400 mb-2 tracking-widest uppercase">{msg.name} {msg.name !== currentUser ? '(队友)' : ''}</div>}
                {msg.role === 'system' && <span className="font-bold text-center block w-full tracking-widest bg-black/20 py-1 rounded">{msg.content}</span>}
                
                {msg.role !== 'system' && (
                  <div className="whitespace-pre-wrap leading-relaxed text-lg text-justify text-gray-200" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>{msg.content}</div>
                )}
              </div>
            ))}
            {isWaitingReady && (
              <div className="self-start text-xs italic opacity-80 tracking-widest max-w-[85%] bg-[#111]/80 px-4 py-2 border border-gray-600 rounded text-dnd-parchment shadow-md">
                ⏳ 正在接收 DM 的天命指引...
              </div>
            )}
            <div ref={endOfLogRef} className="h-4" />
          </div>

          {/* 底部输入区 */}
          <div className="p-4 bg-gradient-to-b from-[#1a1815] to-[#111] border-t-2 border-dnd-gold-dark flex gap-4 items-end shadow-[0_-10px_20px_rgba(0,0,0,0.9)] z-10">
            <textarea 
              disabled={isWaitingReady}
              value={playerInput}
              onChange={e => setPlayerInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitAction();
                }
              }}
              placeholder="宣告你的意志... (如：拔出长剑对老板威吓，或：向暗处投掷 1d20+3的潜行)" 
              className="border-2 border-dnd-gold-dark bg-[#e8deb8] p-3 flex-grow rounded focus:ring-2 focus:ring-[#8b2b2b] outline-none resize-none min-h-[60px] max-h-[120px] text-[#111] font-bold shadow-inner"
              rows="2"
            />
            <button 
              disabled={isWaitingReady}
              onClick={handleSubmitAction} 
              className="btn-dnd font-cinzel font-bold px-8 py-3 h-full min-h-[60px] text-lg disabled:bg-gray-700 disabled:border-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              行动 / 发送
            </button>
          </div>
        </>
      )}

      {/* =========================================
          侧边栏抽屉: 查看我的角色卡 
         ========================================= */}
      <div 
        className={`absolute top-0 right-0 w-[350px] h-full bg-[#f5eedc] text-[#111] border-l-4 border-[#8b2b2b] shadow-[-10px_0_30px_rgba(0,0,0,0.8)] transform transition-transform duration-300 ease-in-out z-30 ${showDrawer ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="bg-[#8b2b2b] text-[#f5eedc] p-3 flex justify-between items-center shadow-md">
          <h2 className="font-bold text-lg tracking-widest">我的角色简卡</h2>
          <button onClick={() => setShowDrawer(false)} className="text-2xl hover:text-white leading-none">&times;</button>
        </div>
        {myChar ? (
           <div className="p-4 overflow-y-auto h-[calc(100%-60px)] custom-scrollbar">
             <div className="text-center mb-4 border-b border-gray-400 pb-4">
               <h3 className="text-2xl font-bold font-cinzel text-red-900">{myChar.basic?.name}</h3>
               <p className="text-sm font-bold mt-1 text-gray-700">{myChar.basic?.race} | {myChar.basic?.charClass} LV.{myChar.basic?.level}</p>
             </div>
             
             <div className="grid grid-cols-3 gap-2 mb-4">
               <div className="bg-white border border-gray-400 rounded text-center p-2 shadow-sm">
                 <div className="text-xs font-bold text-gray-500">AC</div>
                 <div className="text-xl font-bold text-blue-900">{myChar.ac}</div>
               </div>
               <div className="bg-white border border-gray-400 rounded text-center p-2 shadow-sm">
                 <div className="text-xs font-bold text-gray-500">HP</div>
                 <div className="text-xl font-bold text-red-700">{myChar.hp}</div>
               </div>
               <div className="bg-white border border-gray-400 rounded text-center p-2 shadow-sm">
                 <div className="text-xs font-bold text-gray-500">熟练加值</div>
                 <div className="text-xl font-bold text-gray-800">+{myChar.profBonus}</div>
               </div>
             </div>

             <div className="mb-4">
               <h4 className="font-bold mb-2 bg-[#ded2a5] p-1 border border-gray-400 text-center">基础属性</h4>
               <div className="grid grid-cols-3 gap-1 text-xs text-center font-bold">
                 <div className="border p-1 bg-white">力量: {myChar.baseStats?.str}</div>
                 <div className="border p-1 bg-white">敏捷: {myChar.baseStats?.dex}</div>
                 <div className="border p-1 bg-white">体质: {myChar.baseStats?.con}</div>
                 <div className="border p-1 bg-white">智力: {myChar.baseStats?.int}</div>
                 <div className="border p-1 bg-white">感知: {myChar.baseStats?.wis}</div>
                 <div className="border p-1 bg-white">魅力: {myChar.baseStats?.cha}</div>
               </div>
             </div>

             <div className="mb-4">
               <h4 className="font-bold mb-2 bg-[#ded2a5] p-1 border border-gray-400 text-center">熟练技能 (简略)</h4>
               <div className="text-sm border border-gray-400 p-2 bg-white flex flex-wrap gap-2">
                 {Object.entries(myChar.proficiencies?.skills || {})
                   .filter(([_, isProf]) => isProf)
                   .map(([key]) => <span className="bg-gray-200 px-1 rounded border border-gray-300" key={key}>{key}</span>)
                 }
               </div>
             </div>

             <div>
               <h4 className="font-bold mb-2 bg-[#ded2a5] p-1 border border-gray-400 text-center">携带装备</h4>
               <div className="text-sm whitespace-pre-wrap border border-gray-400 p-2 bg-white min-h-[50px]">
                 {myChar.equipment?.weapons || '（空手）'}
               </div>
             </div>
           </div>
        ) : (
           <div className="p-6 text-center text-gray-500 italic">尚未选择任何角色数据。</div>
        )}
      </div>

    </div>
  );
}import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [myChar, setMyChar] = useState(null);
  const [chatLog, setChatLog] = useState([
    { 
      role: 'system', 
      content: `[神谕]：欢迎来到位面坐标 [${roomId}]。战役即刻开始，AI DM 已觉醒。` 
    },
    { 
      role: 'dm', 
      content: '你们穿过雷鸣交加的荒野，最终在暴雨中发现了一处名为「沉睡巨人」的石制旅店。泥水沾满了你们的靴子。推开厚重的橡木门，昏暗的烛光和劣质麦酒的气味扑面而来。旅店老板正在擦拭着吧台，看到你们进来，他警惕地抬起了头。你们打算怎么做？' 
    }
  ]);
  const [playerInput, setPlayerInput] = useState('');
  const [isWaitingReady, setIsWaitingReady] = useState(false);
  const endOfLogRef = useRef(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('trpg_characters') || '[]');
    if(saved.length > 0) {
      setMyChar(saved[0]);
    }
  }, []);

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isWaitingReady]);

  const handleSubmitAction = async () => {
    if (!playerInput.trim()) return;
    
    const playerName = myChar ? myChar.name : "兜帽旅人";
    const newLog = [...chatLog, { role: 'player', name: playerName, content: playerInput }];
    setChatLog(newLog);
    setPlayerInput('');
    setIsWaitingReady(true);

    // 模拟 AI 后端响应
    setTimeout(() => {
      setChatLog(prev => [...prev, { 
        role: 'dm', 
        content: `旅店老板打量了 ${playerName} 一圈，嘟囔道：“住宿5个铜币，要热汤加2个。” 他似乎在掩饰着什么。
请进行一次 【洞察 (Insight)】 检定！(投掷 1d20 + 你的感知调整值)` 
      }]);
      setIsWaitingReady(false);
    }, 2000);
  };

  return (
    <div className="h-[85vh] flex flex-col bg-[#111111] rounded-lg shadow-2xl border border-dnd-gold overflow-hidden text-dnd-parchment font-serif">
      
      {/* DM Screen Top HUD */}
      <div className="bg-[#1a1815] p-3 flex border-b-2 border-dnd-gold-dark justify-between items-center shadow-[0_5px_15px_rgba(0,0,0,0.8)] z-10 px-6">
        <div className="flex items-center gap-4">
          <span className="font-cinzel text-xl text-dnd-gold font-bold drop-shadow-md">🛡️ 战役坐标: {roomId}</span>
          {myChar ? (
            <span className="px-3 py-1 bg-dnd-indigo/40 border border-dnd-indigo rounded text-sm tracking-wide">
              扮演: <span className="font-bold">{myChar.name}</span> ({myChar.charClass} Lv.{myChar.level})
            </span>
          ) : (
            <span 
              className="px-3 py-1 bg-dnd-red-dark/50 border border-dnd-red rounded text-sm cursor-pointer hover:bg-dnd-red transition" 
              onClick={() => navigate('/')}
            >
              ⚠️ 迷失之人 (尚未选择档案，点击去建立)
            </span>
          )}
        </div>
        <button 
          className="font-cinzel font-bold border border-dnd-gold-dark px-4 py-1 rounded hover:bg-dnd-gold-dark hover:text-[#111] transition" 
          onClick={() => navigate('/lobby')}
        >
          离开结界
        </button>
      </div>
      
      {/* 羊皮纸材质的故事日志轴 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col relative bg-parchment-pattern">
        {chatLog.map((msg, idx) => (
          <div 
            key={idx} 
            className={`max-w-[75%] rounded shadow-lg p-5 border border-opacity-30 relative ${
              msg.role === 'dm' 
                ? 'bg-gradient-to-br from-[#2a1a1b] to-[#1c1214] text-[#e8deb8] border-dnd-red self-start shadow-[0_5px_15px_rgba(130,36,36,0.3)]' 
                : msg.role === 'system'
                ? 'bg-transparent text-dnd-dark self-center text-sm border-none shadow-none filter drop-shadow-none'
                : 'bg-gradient-to-br from-[#1d273a] to-[#12182b] text-[#e8deb8] border-dnd-indigo self-end'
            }`}
             style={{ borderStyle: msg.role === 'system' ? 'none' : 'double', borderWidth: msg.role === 'system' ? '0' : '4px' }}
          >
            {msg.role === 'dm' && <div className="text-xs font-bold font-cinzel text-dnd-red mb-2 tracking-widest uppercase">地下城主 (AI DM)</div>}
            {msg.role === 'player' && <div className="text-xs font-bold font-cinzel text-blue-400 mb-2 tracking-widest uppercase">{msg.name}</div>}
            {msg.role === 'system' && <span className="font-bold text-center block w-full tracking-widest">{msg.content}</span>}
            
            {msg.role !== 'system' && (
              <div className="whitespace-pre-wrap leading-relaxed text-lg text-justify" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>{msg.content}</div>
            )}
          </div>
        ))}
        {isWaitingReady && (
          <div className="self-start text-xs italic opacity-80 tracking-widest max-w-[85%] bg-dnd-dark/50 p-2 rounded text-dnd-parchment">
            命运之轮转动中... (DM 正在结算)
          </div>
        )}
        <div ref={endOfLogRef} />
      </div>

      {/* 玩家指令卷轴 */}
      <div className="p-4 bg-[#1a1815] border-t-2 border-dnd-gold-dark flex gap-4 items-end shadow-[0_-5px_15px_rgba(0,0,0,0.8)]">
        <textarea 
          disabled={isWaitingReady}
          value={playerInput}
          onChange={e => setPlayerInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmitAction();
            }
          }}
          placeholder="宣告你的意志... (例如：拔出长剑对老板使用威吓、在此处隐蔽并投掷 1d20+3潜行，按 Enter 回应)" 
          className="border-2 border-dnd-gold-dark bg-[#e8deb8] p-3 flex-grow rounded focus:ring-2 focus:ring-dnd-red outline-none resize-none min-h-[60px] max-h-[150px] text-[#111] font-bold"
          rows="2"
        />
        <button 
          disabled={isWaitingReady}
          onClick={handleSubmitAction} 
          className="btn-dnd font-cinzel px-8 py-4 text-xl disabled:bg-gray-600 disabled:border-gray-500 disabled:cursor-not-allowed mb-1"
        >
          铭示天意
        </button>
      </div>
    </div>
  );
}