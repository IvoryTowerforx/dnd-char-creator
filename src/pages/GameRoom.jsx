import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  API_BASE_URL,
  getAccessToken,
  getCurrentUserId,
  getCurrentUsername,
  getRoom,
  joinRoom,
  leaveRoom,
  listCharacters,
  listRoomMessages,
  setRoomReady,
  startRoom,
  submitRoomAction,
  startCombat,
  nextCombatTurn,
  applyDamage,
  healCombatant,
  endCombat,
  initGrid,
  moveToken,
  addGridToken,
  removeGridToken
} from '../lib/api';

const STATE_LABELS = {
  waiting: '等待中',
  exploration: '探索中',
  combat: '战斗中',
  ended: '已结束'
};

function HpBar({ current, max }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  let color = 'bg-green-500';
  if (pct === 0) color = 'bg-gray-500';
  else if (pct < 0.25) color = 'bg-red-500';
  else if (pct < 0.5) color = 'bg-yellow-500';
  return (
    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

function MiniMap({ grid, selectedTokenId, onSelectToken, onMoveToken }) {
  const tokens = grid?.tokens || [];
  const width = grid?.width || 10;
  const height = grid?.height || 10;
  const cellSize = 18;
  const [moveTarget, setMoveTarget] = useState(null);

  const handleCellClick = (x, y) => {
    if (selectedTokenId && moveTarget === selectedTokenId) {
      onMoveToken(selectedTokenId, x, y);
      setMoveTarget(null);
      return;
    }
    const clicked = tokens.find((t) => t.x === x && t.y === y);
    if (clicked) {
      onSelectToken(clicked.id === selectedTokenId ? null : clicked.id);
      setMoveTarget(null);
    } else if (selectedTokenId) {
      setMoveTarget(selectedTokenId);
    }
  };

  const tokenColor = (t) => {
    if (t.type === 'pc') return '#4a90d9';
    if (t.type === 'npc') return '#d94a4a';
    return '#888888';
  };

  return (
    <div className="bg-[#1a1815] border-r-2 border-[#8b2b2b]/50 p-2 flex flex-col items-center overflow-auto">
      <h3 className="font-cinzel text-sm text-dnd-gold font-bold mb-1">地图</h3>
      <svg width={width * cellSize} height={height * cellSize} className="border border-gray-700">
        {Array.from({ length: height }).map((_, row) =>
          Array.from({ length: width }).map((_, col) => (
            <rect
              key={`${row}-${col}`}
              x={col * cellSize}
              y={row * cellSize}
              width={cellSize}
              height={cellSize}
              fill={(row + col) % 2 === 0 ? '#1e1c18' : '#252320'}
              stroke="#333"
              strokeWidth={0.5}
              onClick={() => handleCellClick(col, row)}
              className="cursor-pointer"
            />
          ))
        )}
        {tokens.map((t) => (
          <g key={t.id}>
            <circle
              cx={t.x * cellSize + cellSize / 2}
              cy={t.y * cellSize + cellSize / 2}
              r={cellSize / 2 - 2}
              fill={tokenColor(t)}
              stroke={t.id === selectedTokenId ? '#d4a017' : 'transparent'}
              strokeWidth={2}
              onClick={() => handleCellClick(t.x, t.y)}
              className="cursor-pointer"
            />
            <text
              x={t.x * cellSize + cellSize / 2}
              y={t.y * cellSize + cellSize / 2 + 3}
              textAnchor="middle"
              fill="white"
              fontSize={7}
              className="pointer-events-none select-none"
            >
              {(t.label || t.name || '?').slice(0, 3)}
            </text>
          </g>
        ))}
      </svg>
      {selectedTokenId && moveTarget === selectedTokenId && (
        <p className="text-xs text-dnd-gold mt-1">点击空格移动</p>
      )}
      {selectedTokenId && moveTarget !== selectedTokenId && (
        <p className="text-xs text-gray-400 mt-1">再次点击token或空格移动</p>
      )}
    </div>
  );
}

function CombatPanel({ combat, isHost, roomId, onAction }) {
  const [damageInput, setDamageInput] = useState('');
  const [healInput, setHealInput] = useState('');
  const [showDamage, setShowDamage] = useState(false);
  const [showHeal, setShowHeal] = useState(false);
  const [busy, setBusy] = useState(false);

  const combatants = combat?.combatants || [];
  const currentTurn = combat?.currentTurnIndex ?? -1;
  const round = combat?.round ?? 0;
  const currentCombatant = combatants[currentTurn];

  const handleNext = async () => {
    setBusy(true);
    try {
      await nextCombatTurn(roomId);
      onAction?.();
    } catch (e) {
      alert(e?.message || '操作失败');
    } finally {
      setBusy(false);
    }
  };

  const handleDamage = async () => {
    const amount = parseInt(damageInput, 10);
    if (!amount || amount <= 0 || !currentCombatant) return;
    setBusy(true);
    try {
      await applyDamage(roomId, currentCombatant.id, amount);
      setShowDamage(false);
      setDamageInput('');
      onAction?.();
    } catch (e) {
      alert(e?.message || '操作失败');
    } finally {
      setBusy(false);
    }
  };

  const handleHeal = async () => {
    const amount = parseInt(healInput, 10);
    if (!amount || amount <= 0 || !currentCombatant) return;
    setBusy(true);
    try {
      await healCombatant(roomId, currentCombatant.id, amount);
      setShowHeal(false);
      setHealInput('');
      onAction?.();
    } catch (e) {
      alert(e?.message || '操作失败');
    } finally {
      setBusy(false);
    }
  };

  const handleEndCombat = async () => {
    if (!confirm('确定要结束战斗吗？')) return;
    setBusy(true);
    try {
      await endCombat(roomId);
      onAction?.();
    } catch (e) {
      alert(e?.message || '操作失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-[280px] bg-[#1a1815] border-l-2 border-[#8b2b2b]/50 p-3 flex flex-col overflow-y-auto">
      <h3 className="font-cinzel text-lg text-dnd-gold font-bold mb-2 text-center border-b border-dnd-gold-dark pb-2">
        战斗面板
      </h3>
      <div className="text-center mb-3">
        <span className="text-sm text-gray-300">Round {round}</span>
        {currentCombatant && (
          <p className="text-dnd-gold font-bold mt-1">
            当前: {currentCombatant.name}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-2 mb-3">
        {combatants.map((c, idx) => {
          const isCurrent = idx === currentTurn;
          const hpMax = c.hpMax ?? c.maxHp ?? 1;
          return (
            <div
              key={c.id}
              className={`p-2 rounded border ${
                isCurrent
                  ? 'bg-black/40 border-[#d4a017] shadow-[0_0_8px_rgba(212,160,23,0.3)]'
                  : 'bg-black/40 border-gray-700'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-bold ${isCurrent ? 'text-[#d4a017]' : 'text-gray-200'}`}>
                  {c.name}
                </span>
                <span className="text-xs text-gray-400">AC {c.ac ?? '-'}</span>
              </div>
              <HpBar current={c.hp ?? 0} max={hpMax} />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{c.hp ?? 0}/{hpMax}</span>
                <span>Init {c.initiative ?? '-'}</span>
              </div>
              {c.conditions?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {c.conditions.map((cond) => (
                    <span key={cond} className="text-[10px] bg-red-900/60 text-red-200 px-1 rounded border border-red-700">
                      {cond}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 border-t border-gray-700 pt-2">
        <button
          onClick={handleNext}
          disabled={busy}
          className="w-full bg-[#8b2b2b] text-white py-1.5 rounded font-bold text-sm hover:bg-red-700 disabled:opacity-50"
        >
          下一回合
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowDamage(true); setShowHeal(false); }}
            disabled={busy}
            className="flex-1 bg-orange-800 text-white py-1 rounded text-xs font-bold hover:bg-orange-700 disabled:opacity-50"
          >
            造成伤害
          </button>
          <button
            onClick={() => { setShowHeal(true); setShowDamage(false); }}
            disabled={busy}
            className="flex-1 bg-green-800 text-white py-1 rounded text-xs font-bold hover:bg-green-700 disabled:opacity-50"
          >
            治疗
          </button>
        </div>
        {showDamage && (
          <div className="flex gap-1">
            <input
              type="number"
              min={1}
              value={damageInput}
              onChange={(e) => setDamageInput(e.target.value)}
              placeholder="伤害值"
              className="flex-1 bg-black/60 border border-gray-600 rounded px-2 py-1 text-sm text-white outline-none"
            />
            <button onClick={handleDamage} disabled={busy} className="bg-orange-700 text-white px-2 py-1 rounded text-xs font-bold">确认</button>
            <button onClick={() => setShowDamage(false)} className="text-gray-400 text-xs">取消</button>
          </div>
        )}
        {showHeal && (
          <div className="flex gap-1">
            <input
              type="number"
              min={1}
              value={healInput}
              onChange={(e) => setHealInput(e.target.value)}
              placeholder="治疗值"
              className="flex-1 bg-black/60 border border-gray-600 rounded px-2 py-1 text-sm text-white outline-none"
            />
            <button onClick={handleHeal} disabled={busy} className="bg-green-700 text-white px-2 py-1 rounded text-xs font-bold">确认</button>
            <button onClick={() => setShowHeal(false)} className="text-gray-400 text-xs">取消</button>
          </div>
        )}
        {isHost && (
          <button
            onClick={handleEndCombat}
            disabled={busy}
            className="w-full bg-gray-800 text-gray-300 py-1.5 rounded text-xs font-bold border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
          >
            结束战斗
          </button>
        )}
      </div>
    </div>
  );
}

function StartCombatDialog({ players, onClose, onStart }) {
  const [selected, setSelected] = useState(new Set(players.map((p) => p.userId)));
  const [npcName, setNpcName] = useState('');
  const [npcs, setNpcs] = useState([]);
  const [busy, setBusy] = useState(false);

  const togglePlayer = (userId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const addNpc = () => {
    const name = npcName.trim();
    if (!name) return;
    setNpcs((prev) => [...prev, { id: `npc-${Date.now()}`, name, type: 'npc' }]);
    setNpcName('');
  };

  const removeNpc = (id) => {
    setNpcs((prev) => prev.filter((n) => n.id !== id));
  };

  const handleStart = async () => {
    if (selected.size === 0 && npcs.length === 0) {
      alert('至少选择一个参战者');
      return;
    }
    setBusy(true);
    try {
      await onStart({
        participantIds: Array.from(selected),
        npcs
      });
    } catch (e) {
      alert(e?.message || '发起战斗失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1a1815] border-2 border-dnd-gold-dark rounded-lg p-6 w-[400px] max-h-[80vh] overflow-y-auto">
        <h3 className="font-cinzel text-xl text-dnd-gold font-bold mb-4 text-center">发起战斗</h3>
        <div className="mb-4">
          <h4 className="text-sm text-gray-300 mb-2 font-bold">选择参战玩家:</h4>
          {players.map((p) => (
            <label key={p.userId} className="flex items-center gap-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(p.userId)}
                onChange={() => togglePlayer(p.userId)}
                className="accent-[#d4a017]"
              />
              <span className="text-gray-200 text-sm">{p.username}</span>
              {p.character && <span className="text-xs text-gray-500">({p.character.basic?.name})</span>}
            </label>
          ))}
        </div>
        <div className="mb-4">
          <h4 className="text-sm text-gray-300 mb-2 font-bold">添加 NPC:</h4>
          <div className="flex gap-2 mb-2">
            <input
              value={npcName}
              onChange={(e) => setNpcName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNpc()}
              placeholder="NPC 名称"
              className="flex-1 bg-black/60 border border-gray-600 rounded px-2 py-1 text-sm text-white outline-none"
            />
            <button onClick={addNpc} className="bg-dnd-gold-dark text-black px-3 py-1 rounded text-xs font-bold">添加</button>
          </div>
          {npcs.map((n) => (
            <div key={n.id} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-200">{n.name}</span>
              <button onClick={() => removeNpc(n.id)} className="text-red-400 text-xs">移除</button>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleStart}
            disabled={busy}
            className="flex-1 bg-[#8b2b2b] text-white py-2 rounded font-bold hover:bg-red-700 disabled:opacity-50"
          >
            开战！
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 text-gray-300 py-2 rounded font-bold hover:bg-gray-600"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [room, setRoom] = useState(null);
  const [mySavedCards, setMySavedCards] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [chatLog, setChatLog] = useState([]);
  const [playerInput, setPlayerInput] = useState('');
  const [isWaitingReady, setIsWaitingReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [showStartCombat, setShowStartCombat] = useState(false);

  const endOfLogRef = useRef(null);
  const socketRef = useRef(null);

  const currentUser = getCurrentUsername() || '神秘旅人';
  const currentUserId = getCurrentUserId();
  const token = getAccessToken();
  const normalizedRoomId = String(roomId || '').toUpperCase();

  const roomState = room?.state || 'waiting';
  const isHost = room?.hostUserId === currentUserId;
  const combat = room?.combat || null;
  const grid = room?.grid || null;

  const isInGame = roomState === 'exploration' || roomState === 'combat';

  const players = useMemo(() => {
    if (!room) return [];
    return room.players.map((player) => {
      const card = mySavedCards.find((item) => item.id === player.characterId);
      return {
        ...player,
        character: card || null
      };
    });
  }, [room, mySavedCards]);

  const myPlayer = useMemo(() => {
    return players.find((player) => player.userId === currentUserId) || null;
  }, [players, currentUserId]);

  const isReady = Boolean(myPlayer?.isReady);
  const myChar = useMemo(() => {
    const targetCharId = selectedCharId || myPlayer?.characterId;
    return mySavedCards.find((item) => item.id === targetCharId) || null;
  }, [mySavedCards, selectedCharId, myPlayer]);

  const getCardAc = (card) => card?.derived?.ac ?? card?.ac ?? '-';
  const getCardHp = (card) => card?.derived?.hp ?? card?.hp ?? '-';

  const mapMessages = (messages) => {
    return (messages || []).map((item) => ({
      id: item.id,
      role: item.role,
      name: item.senderName,
      content: item.content,
      seq: item.seq
    }));
  };

  const mergeMessages = (incoming) => {
    const mappedIncoming = mapMessages(incoming);
    setChatLog((prev) => {
      const dedup = new Map();
      [...prev, ...mappedIncoming].forEach((item) => {
        const key = item.id || `${item.seq || 0}-${item.role}`;
        dedup.set(key, item);
      });

      return Array.from(dedup.values()).sort((a, b) => (a.seq || 0) - (b.seq || 0));
    });
  };

  const loadCharacters = async () => {
    try {
      const response = await listCharacters();
      setMySavedCards(response.items || []);
    } catch (error) {
      console.error(error);
      const fallback = JSON.parse(localStorage.getItem('trpg_characters') || '[]');
      setMySavedCards(fallback);
    }
  };

  const refreshRoom = async () => {
    const snapshot = await getRoom(normalizedRoomId);
    setRoom(snapshot);
    const me = snapshot.players?.find((item) => item.userId === currentUserId);
    if (me?.characterId) {
      setSelectedCharId((prev) => prev || me.characterId);
    }
    return snapshot;
  };

  const refreshMessages = async () => {
    const response = await listRoomMessages(normalizedRoomId, 0, 200);
    setChatLog(mapMessages(response.messages));
  };

  useEffect(() => {
    endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isWaitingReady, roomState]);

  useEffect(() => {
    const init = async () => {
      if (!token || !currentUserId) {
        alert('请先登录再进入房间。');
        navigate('/');
        return;
      }

      if (!normalizedRoomId) {
        alert('无效的房间号。');
        navigate('/lobby');
        return;
      }

      try {
        const joinWord = location.state?.joinWord || '';
        await joinRoom(normalizedRoomId, joinWord);
      } catch (error) {
        alert(error?.message || '加入房间失败，请返回大厅重试。');
        navigate('/lobby');
        return;
      }

      try {
        await Promise.all([loadCharacters(), refreshRoom(), refreshMessages()]);
      } catch (error) {
        alert(error?.message || '房间初始化失败，请稍后重试。');
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedRoomId]);

  useEffect(() => {
    if (!normalizedRoomId || loading) return;
    const timer = setInterval(async () => {
      if (socketRef.current?.connected) {
        return;
      }
      try {
        await refreshRoom();
        await refreshMessages();
      } catch {
        // Ignore transient polling errors.
      }
    }, 5000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedRoomId, loading]);

  useEffect(() => {
    if (!token || !normalizedRoomId || loading) return;

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      auth: {
        token
      }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('room:join', {
        roomId: normalizedRoomId
      });
    });

    socket.on('room:snapshot', (payload) => {
      if (payload?.room?.id !== normalizedRoomId) return;
      setRoom(payload.room);
    });

    socket.on('room:messages', (payload) => {
      if (payload?.roomId !== normalizedRoomId) return;
      mergeMessages(payload.messages || []);
      if (typeof payload.roomVersion === 'number') {
        setRoom((prev) => (prev ? { ...prev, roomVersion: payload.roomVersion } : prev));
      }
    });

    socket.on('room:combat', (payload) => {
      if (payload?.roomId !== normalizedRoomId) return;
      setRoom((prev) => (prev ? { ...prev, combat: payload.combat } : prev));
    });

    socket.on('room:grid', (payload) => {
      if (payload?.roomId !== normalizedRoomId) return;
      setRoom((prev) => (prev ? { ...prev, grid: payload.grid } : prev));
    });

    socket.on('room:error', (payload) => {
      console.warn('room:error', payload);
    });

    return () => {
      try {
        socket.emit('room:leave', {
          roomId: normalizedRoomId
        });
      } catch {
        // Ignore leave signal errors.
      }
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, normalizedRoomId, loading]);

  const toggleReady = async () => {
    if (!selectedCharId && !isReady) {
      alert('请先在下方选择一张你要出战的角色卡！');
      return;
    }

    if (!room || isBusy) return;

    setIsBusy(true);
    try {
      const updated = await setRoomReady(normalizedRoomId, {
        isReady: !isReady,
        characterId: selectedCharId || myPlayer?.characterId || undefined,
        expectedRoomVersion: room.roomVersion
      });
      setRoom(updated);
      await refreshMessages();
    } catch (error) {
      alert(error?.message || '切换准备状态失败，请重试。');
      await refreshRoom();
    } finally {
      setIsBusy(false);
    }
  };

  const handleStartGame = async () => {
    if (!room || isBusy) return;
    if (!isHost) {
      alert('仅房主可以开始战役。');
      return;
    }

    setIsBusy(true);
    try {
      const updated = await startRoom(normalizedRoomId, {
        expectedRoomVersion: room.roomVersion
      });
      setRoom(updated);
      await refreshMessages();
    } catch (error) {
      alert(error?.message || '开局失败，请检查所有玩家是否已准备。');
      await refreshRoom();
    } finally {
      setIsBusy(false);
    }
  };

  const handleSubmitAction = async () => {
    if (!playerInput.trim() || isWaitingReady) return;

    setIsWaitingReady(true);
    try {
      await submitRoomAction(normalizedRoomId, playerInput.trim());
      setPlayerInput('');
      await refreshMessages();
    } catch (error) {
      alert(error?.message || '行动发送失败，请稍后重试。');
    } finally {
      setIsWaitingReady(false);
    }
  };

  const handleExitRoom = async () => {
    try {
      if (token && currentUserId && normalizedRoomId) {
        await leaveRoom(normalizedRoomId);
      }
    } catch {
      // Ignore leave errors when navigating away.
    }
    navigate('/lobby');
  };

  const handleMoveToken = async (tokenId, x, y) => {
    try {
      await moveToken(normalizedRoomId, tokenId, { x, y });
      await refreshRoom();
    } catch (e) {
      alert(e?.message || '移动失败');
    }
  };

  const handleStartCombat = async (payload) => {
    try {
      await startCombat(normalizedRoomId, payload);
      setShowStartCombat(false);
      await refreshRoom();
    } catch (e) {
      throw e;
    }
  };

  if (loading) {
    return (
      <div className="h-[85vh] flex items-center justify-center bg-[#111111] rounded-lg border-2 border-dnd-gold-dark text-dnd-parchment">
        正在连线位面 {normalizedRoomId}...
      </div>
    );
  }

  return (
    <div className="h-[85vh] flex flex-col bg-[#111111] rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.8)] border-2 border-dnd-gold-dark overflow-hidden text-dnd-parchment font-serif relative">

      {/* === HEADER === */}
      <div className="bg-gradient-to-r from-[#1a1815] to-[#251b1a] p-4 flex justify-between items-center shadow-lg border-b-2 border-[#8b2b2b] z-20">
        <div className="flex items-center gap-4">
          <span className="font-cinzel text-xl text-dnd-gold font-bold drop-shadow-md">🛡️ 战役坐标: {normalizedRoomId}</span>
          <span className={`text-sm font-bold px-2 py-0.5 rounded border ${
            roomState === 'combat' ? 'bg-red-900/60 text-red-200 border-red-700' :
            roomState === 'exploration' ? 'bg-green-900/60 text-green-200 border-green-700' :
            roomState === 'ended' ? 'bg-gray-800 text-gray-400 border-gray-600' :
            'bg-yellow-900/60 text-yellow-200 border-yellow-700'
          }`}>
            {STATE_LABELS[roomState] || roomState}
          </span>
          {roomState === 'combat' && combat && (
            <span className="text-xs text-gray-400">Round {combat.round ?? 0}</span>
          )}
          <span className="text-gray-400 text-sm">| 宿主: {currentUser}</span>
        </div>
        <div className="flex items-center gap-3">
          {isInGame && (
            <button
              onClick={() => setShowDrawer(!showDrawer)}
              className="font-bold border px-4 py-1 rounded transition border-dnd-gold text-dnd-gold hover:bg-dnd-gold hover:text-black shadow-md bg-black/40"
            >
              🔍 查看我的角色卡
            </button>
          )}
          {roomState === 'exploration' && isHost && (
            <button
              onClick={() => setShowStartCombat(true)}
              className="font-bold border px-4 py-1 rounded transition border-red-500 text-red-400 hover:bg-red-800 hover:text-white shadow-md bg-black/40"
            >
              ⚔️ 发起战斗
            </button>
          )}
          <button
            className="font-cinzel font-bold border border-red-900 px-4 py-1 rounded hover:bg-red-900 hover:text-white transition text-gray-300"
            onClick={handleExitRoom}
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
                <div key={p.id || p.userId} className="bg-black/40 border border-gray-700 p-3 rounded flex items-center justify-between">
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
                  disabled={!isHost || isBusy}
                  className="w-full bg-[#8b2b2b] text-white py-3 rounded font-bold tracking-widest font-cinzel hover:bg-red-700 border-2 border-[#e8deb8] shadow-[0_0_10px_rgba(139,43,43,0.8)]"
               >
                 {isHost ? '🏁 满员且就绪，即刻发车！' : '等待房主开局'}
               </button>
               <p className="text-xs text-gray-500 mt-2">（已启用实时推送，断连时自动降级轮询）</p>
            </div>
          </div>

          {/* 右侧：角色卡选择及准备 */}
          <div className="w-2/3 bg-dnd-dark p-6 overflow-y-auto relative">
            <div className="absolute inset-0 pointer-events-none pattern-overlay opacity-10"></div>
            <div className="relative z-10 flex justify-between items-center mb-6 border-b border-dnd-gold-dark pb-2">
              <h2 className="text-2xl font-bold font-cinzel text-dnd-red-dark drop-shadow-sm text-dnd-parchment">我的传承记录 (本服角色库)</h2>
              <button
                onClick={toggleReady}
                disabled={isBusy}
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
                         <span className="bg-white/50 border border-gray-400 px-1 rounded">AC {getCardAc(c)}</span>
                         <span className="bg-white/50 border border-gray-400 px-1 rounded">HP {getCardHp(c)}</span>
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
          GAME ROOM (游玩区 - exploration/combat)
         ========================================= */}
      {isInGame && (
        <>
          <div className="flex-1 flex overflow-hidden">
            {grid && (
              <MiniMap
                grid={grid}
                selectedTokenId={selectedTokenId}
                onSelectToken={setSelectedTokenId}
                onMoveToken={handleMoveToken}
              />
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col relative bg-parchment-pattern scroll-smooth">
                {chatLog.map((msg, idx) => (
                  <div
                    key={msg.id || `${msg.role}-${idx}`}
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
            </div>

            {roomState === 'combat' && combat && (
              <CombatPanel
                combat={combat}
                isHost={isHost}
                roomId={normalizedRoomId}
                onAction={refreshRoom}
              />
            )}
          </div>
        </>
      )}

      {/* =========================================
          ENDED STATE
         ========================================= */}
      {roomState === 'ended' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-cinzel text-3xl text-dnd-gold mb-4">战役已结束</h2>
            <p className="text-gray-400 mb-6">感谢各位冒险者的参与！</p>
            <button
              onClick={handleExitRoom}
              className="bg-[#8b2b2b] text-white px-8 py-3 rounded font-bold font-cinzel hover:bg-red-700 border-2 border-[#e8deb8]"
            >
              返回大厅
            </button>
          </div>
        </div>
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
                 <div className="text-xl font-bold text-blue-900">{myChar?.derived?.ac ?? myChar?.ac}</div>
               </div>
               <div className="bg-white border border-gray-400 rounded text-center p-2 shadow-sm">
                 <div className="text-xs font-bold text-gray-500">HP</div>
                 <div className="text-xl font-bold text-red-700">{myChar?.derived?.hp ?? myChar?.hp}</div>
               </div>
               <div className="bg-white border border-gray-400 rounded text-center p-2 shadow-sm">
                 <div className="text-xs font-bold text-gray-500">PB</div>
                 <div className="text-xl font-bold text-gray-800">+{myChar?.derived?.profBonus ?? myChar?.profBonus}</div>
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

      {showStartCombat && (
        <StartCombatDialog
          players={players}
          onClose={() => setShowStartCombat(false)}
          onStart={handleStartCombat}
        />
      )}

    </div>
  );
}
