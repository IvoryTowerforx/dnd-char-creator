import { useState, useRef, useEffect } from 'react';
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