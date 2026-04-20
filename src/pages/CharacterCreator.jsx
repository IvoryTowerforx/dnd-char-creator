import React, { useState, useEffect } from 'react';

// === D&D 5E 基础规则数据 ===
const RACES = {
  "人类": { bonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, desc: "全属性+1", traits: "多种语言" },
  "精灵": { bonus: { str: 0, dex: 2, con: 0, int: 1, wis: 0, cha: 0 }, desc: "敏捷+2, 智力+1", traits: "黑暗视觉，敏锐感官，妖精血统，出神" },
  "矮人": { bonus: { str: 0, dex: 0, con: 2, int: 0, wis: 1, cha: 0 }, desc: "体质+2, 感知+1", traits: "黑暗视觉，矮人韧性，矮人战斗训练" },
  "半身人": { bonus: { str: 0, dex: 2, con: 0, int: 0, wis: 0, cha: 1 }, desc: "敏捷+2, 魅力+1", traits: "幸运，勇敢，半身人灵巧" },
  "提夫林": { bonus: { str: 0, dex: 0, con: 0, int: 1, wis: 0, cha: 2 }, desc: "魅力+2, 智力+1", traits: "黑暗视觉，地狱抗性，炼狱遗志" },
};

const CLASSES = {
  "战士": { saves: ["str", "con"], hd: 10, spellStat: "str", features: { 1: "战斗风格, 复苏之风", 2: "动作如潮", 3: "武术范型", 4: "属性值提升 / 专长", 5: "额外攻击" } },
  "法师": { saves: ["int", "wis"], hd: 6, spellStat: "int", features: { 1: "施法, 奥术回能", 2: "奥术传承", 3: "二级法术位解锁", 4: "属性值提升 / 专长", 5: "三级法术位解锁" } },
  "游荡者": { saves: ["dex", "int"], hd: 8, spellStat: "dex", features: { 1: "专精, 偷袭(1d6)", 2: "灵巧动作", 3: "游荡者范型, 偷袭(2d6)", 4: "属性值提升 / 专长", 5: "直觉闪避, 偷袭(3d6)" } },
  "牧师": { saves: ["wis", "cha"], hd: 8, spellStat: "wis", features: { 1: "施法, 神圣领域", 2: "引导神力", 3: "二级法术位解锁", 4: "属性值提升 / 专长", 5: "摧毁死灵" } },
  "圣武士": { saves: ["wis", "cha"], hd: 10, spellStat: "cha", features: { 1: "神圣感知, 圣疗", 2: "战斗风格, 施法, 至圣斩", 3: "神圣誓言, 免疫疾病", 4: "属性值提升 / 专长", 5: "额外攻击, 二级法术" } },
};

const STATS = [
  { id: "str", name: "力量" }, { id: "dex", name: "敏捷" },
  { id: "con", name: "体质" }, { id: "int", name: "智力" },
  { id: "wis", name: "感知" }, { id: "cha", name: "魅力" }
];

const SKILLS = [
  { id: "athletics", name: "运动", stat: "str" },
  { id: "acrobatics", name: "体操", stat: "dex" },
  { id: "sleight_of_hand", name: "巧手", stat: "dex" },
  { id: "stealth", name: "隐匿", stat: "dex" },
  { id: "arcana", name: "奥秘", stat: "int" },
  { id: "history", name: "历史", stat: "int" },
  { id: "investigation", name: "调查", stat: "int" },
  { id: "nature", name: "自然", stat: "int" },
  { id: "religion", name: "宗教", stat: "int" },
  { id: "animal_handling", name: "驯兽", stat: "wis" },
  { id: "insight", name: "洞悉", stat: "wis" },
  { id: "medicine", name: "医药", stat: "wis" },
  { id: "perception", name: "察觉", stat: "wis" },
  { id: "survival", name: "求生", stat: "wis" },
  { id: "deception", name: "欺瞒", stat: "cha" },
  { id: "intimidation", name: "威吓", stat: "cha" },
  { id: "performance", name: "表演", stat: "cha" },
  { id: "persuasion", name: "游说", stat: "cha" }
];

const ARMORS = {
  "none": { name: "无护甲", baseAc: 10, dexType: "full" },
  "leather": { name: "皮甲 (轻甲)", baseAc: 11, dexType: "full" },
  "studded": { name: "镶嵌皮甲 (轻甲)", baseAc: 12, dexType: "full" },
  "chain_shirt": { name: "链甲衫 (中甲)", baseAc: 13, dexType: "max2" },
  "scale": { name: "鳞甲 (中甲)", baseAc: 14, dexType: "max2" },
  "chain_mail": { name: "链甲 (重甲)", baseAc: 16, dexType: "none" },
  "plate": { name: "板甲 (重甲)", baseAc: 18, dexType: "none" }
};

const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

const PORTRAITS = {
  "人类": "https://api.dicebear.com/7.x/adventurer/svg?seed=human",
  "精灵": "https://api.dicebear.com/7.x/adventurer/svg?seed=elf",
  "矮人": "https://api.dicebear.com/7.x/adventurer/svg?seed=dwarf",
  "半身人": "https://api.dicebear.com/7.x/adventurer/svg?seed=halfling",
  "提夫林": "https://api.dicebear.com/7.x/adventurer/svg?seed=tiefling"
};

const BACKGROUNDS = ["平民", "贵族", "学者", "士兵", "罪犯", "骗子", "侍僧", "化外之民"];

export default function CharacterCreator() {
  const [basic, setBasic] = useState({ name: '', race: '人类', charClass: '战士', background: '平民', level: 1, customPortrait: '' });
  const [statMethod, setStatMethod] = useState('pointBuy');
  const [baseStats, setBaseStats] = useState({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
  const [proficiencies, setProficiencies] = useState({ skills: {} });
  const [equipment, setEquipment] = useState({ armor: 'none', shield: false, weapons: '长剑 (1d8 挥砍)\n短弓 (1d6 穿刺)' });
  const [spells, setSpells] = useState('');
  const [specialAttrs, setSpecialAttrs] = useState('');
  const [savedCards, setSavedCards] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('trpg_characters') || '[]');
    setSavedCards(saved);
  }, []);

  const getModifier = (score) => Math.floor((score - 10) / 2);
  const getProfBonus = (level) => Math.floor((level - 1) / 4) + 2;

  const getFinalStat = (statId) => {
    const raceBonus = RACES[basic.race].bonus[statId] || 0;
    return baseStats[statId] + raceBonus;
  };
  const getFinalMod = (statId) => getModifier(getFinalStat(statId));

  const calculatePointsRemaining = () => {
    let spent = 0;
    for (let key in baseStats) {
      spent += POINT_BUY_COST[baseStats[key]] || 0;
    }
    return 27 - spent;
  };

  const handlePointBuy = (statId, increment) => {
    const current = baseStats[statId];
    const nextVal = current + increment;
    if (nextVal < 8 || nextVal > 15) return;
    const costDiff = POINT_BUY_COST[nextVal] - POINT_BUY_COST[current];
    if (increment > 0 && calculatePointsRemaining() - costDiff < 0) return;
    setBaseStats({ ...baseStats, [statId]: nextVal });
  };

  const rollStats = () => {
    const newStats = {};
    STATS.forEach(s => {
      let rolls = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => b - a);
      newStats[s.id] = rolls[0] + rolls[1] + rolls[2];
    });
    setBaseStats(newStats);
  };

  const toggleSkill = (skillId) => {
    setProficiencies(prev => {
      const isCurrentlyProficient = prev.skills[skillId];
      if (!isCurrentlyProficient) {
        const selectedCount = Object.values(prev.skills).filter(Boolean).length;
        if (selectedCount >= 2) {
          alert("受当前版本限制，手动勾选的熟练技能最多只能选择2项！(完整种族/职业/背景预设熟练项系统敬请期待)");
          return prev;
        }
      }
      return {
        ...prev,
        skills: { ...prev.skills, [skillId]: !isCurrentlyProficient }
      }
    });
  };

  const profBonus = getProfBonus(basic.level);
  const dexMod = getFinalMod("dex");
  
  const calculateAC = () => {
    const armorInfo = ARMORS[equipment.armor];
    let ac = armorInfo.baseAc;
    if (armorInfo.dexType === "full") ac += dexMod;
    else if (armorInfo.dexType === "max2") ac += Math.min(2, Math.max(0, dexMod));
    if (armorInfo.dexType === "max2" && dexMod < 0) ac += dexMod;
    if (equipment.shield) ac += 2;
    return ac;
  };
  
  const passivePerception = 10 + getFinalMod("wis") + (proficiencies.skills["perception"] ? profBonus : 0);
  const spellStat = CLASSES[basic.charClass].spellStat;
  const spellDC = 8 + profBonus + getFinalMod(spellStat);
  const hp = CLASSES[basic.charClass].hd + getFinalMod("con") + (CLASSES[basic.charClass].hd / 2 + 1 + getFinalMod("con")) * (basic.level - 1);

  const getFeaturesByLevel = () => {
    const cls = CLASSES[basic.charClass];
    let abilities = [];
    for (let i = 1; i <= basic.level; i++) {
      if (cls?.features[i]) abilities.push(`Lv ${i}: ${cls.features[i]}`);
    }
    return abilities.length > 0 ? abilities : ["该等级未解锁新能力。"];
  };

  const handleSave = () => {
    if (!basic.name.trim()) return alert("请输入角色名！");
    // Ensure all elements exist and are saved properly into the card
    const newCard = {
      id: Date.now(), 
      basic, 
      statMethod,
      baseStats,
      proficiencies,
      ac: calculateAC(), 
      hp: Math.floor(hp), 
      profBonus, 
      spells, 
      equipment, 
      specialAttrs
    };
    const newCards = [...savedCards, newCard];
    setSavedCards(newCards);
    localStorage.setItem('trpg_characters', JSON.stringify(newCards));
    alert("角色卡已保存！");
  };

  const loadCharacter = (card) => {
    setBasic(card.basic);
    setStatMethod(card.statMethod || 'pointBuy');
    setBaseStats(card.baseStats || { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
    setProficiencies(card.proficiencies || { skills: {} });
    setEquipment(card.equipment || { armor: 'none', shield: false, weapons: '' });
    setSpells(card.spells || '');
    setSpecialAttrs(card.specialAttrs || '');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 滚动到顶部以便查看
  };

  const handleDelete = (id) => {
    const filtered = savedCards.filter(c => c.id !== id);
    setSavedCards(filtered);
    localStorage.setItem('trpg_characters', JSON.stringify(filtered));
  };

  return (
    <div className="space-y-8 text-dnd-dark max-w-7xl mx-auto font-serif">
      <div className="panel-dnd p-6 md:p-8 relative grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 左侧：基本信息与属性 */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-cinzel border-b border-gray-400 pb-2 text-dnd-red-dark">基本信息 (Character Info)</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3">
                <label className="block text-sm font-bold mb-1">角色名</label>
                <input value={basic.name} onChange={e => setBasic({...basic, name: e.target.value})} className="input-dnd p-2 w-full" placeholder="输入名字..." />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold mb-1">种族</label>
                <select value={basic.race} onChange={e => setBasic({...basic, race: e.target.value})} className="input-dnd p-2 w-full">
                  {Object.keys(RACES).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">职业</label>
                <select value={basic.charClass} onChange={e => setBasic({...basic, charClass: e.target.value})} className="input-dnd p-2 w-full">
                  {Object.keys(CLASSES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">背景</label>
                <select value={basic.background} onChange={e => setBasic({...basic, background: e.target.value})} className="input-dnd p-2 w-full">
                  {BACKGROUNDS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">等级 (1-20)</label>
                <input type="number" min="1" max="20" value={basic.level} onChange={e => setBasic({...basic, level: parseInt(e.target.value)||1})} className="input-dnd p-2 w-full" />
              </div>
            </div>
          </div>

          <div className="bg-[#e8deb8] border border-gray-300 p-4 rounded shadow-sm">
            <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
              <h3 className="font-bold text-lg">属性 (Attributes)</h3>
              <div className="flex gap-4 text-sm font-bold">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="statMethod" checked={statMethod==='pointBuy'} onChange={() => {setStatMethod('pointBuy'); setBaseStats({str:8,dex:8,con:8,int:8,wis:8,cha:8})}} />
                  Buy点 (27分)
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" name="statMethod" checked={statMethod==='roll'} onChange={() => setStatMethod('roll')} />
                  掷骰 (4d6)
                </label>
              </div>
            </div>

            {statMethod === 'pointBuy' && (
              <div className="mb-4 text-sm font-bold">剩余可用点数: {calculatePointsRemaining()} / 27</div>
            )}
            {statMethod === 'roll' && (
              <div className="mb-4"><button onClick={rollStats} className="bg-gray-700 text-white px-3 py-1 rounded text-sm">重新投掷</button></div>
            )}

            <div className="grid grid-cols-6 gap-2 text-center text-sm">
              <div className="font-bold border-b border-gray-300 pb-1">属性</div>
              <div className="font-bold border-b border-gray-300 pb-1">基础</div>
              <div className="font-bold border-b border-gray-300 pb-1 text-red-700">种族+</div>
              <div className="font-bold border-b border-gray-300 pb-1">最终</div>
              <div className="font-bold border-b border-gray-300 pb-1 text-blue-800">调整值</div>
              <div className="font-bold border-b border-gray-300 pb-1">豁免 (自动)</div>

              {STATS.map(stat => {
                const isSaveProf = CLASSES[basic.charClass].saves.includes(stat.id);
                const mod = getFinalMod(stat.id);
                const saveMod = mod + (isSaveProf ? profBonus : 0);

                return (
                  <React.Fragment key={stat.id}>
                    <div className="flex items-center justify-center font-bold">{stat.name}</div>
                    <div className="flex items-center justify-center">
                      {statMethod === 'pointBuy' ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handlePointBuy(stat.id, -1)} className="w-5 h-5 bg-gray-300 hover:bg-gray-400 rounded-full leading-none">-</button>
                          <span className="w-6 text-center font-bold">{baseStats[stat.id]}</span>
                          <button onClick={() => handlePointBuy(stat.id, 1)} className="w-5 h-5 bg-gray-300 hover:bg-gray-400 rounded-full leading-none">+</button>
                        </div>
                      ) : (
                        <input type="number" value={baseStats[stat.id]} onChange={(e) => setBaseStats({...baseStats, [stat.id]: parseInt(e.target.value)||10})} className="w-12 text-center border bg-white rounded" />
                      )}
                    </div>
                    <div className="flex items-center justify-center text-red-700">+{RACES[basic.race].bonus[stat.id] || 0}</div>
                    <div className="flex items-center justify-center font-bold text-lg bg-white/50 rounded-sm">{getFinalStat(stat.id)}</div>
                    <div className="flex items-center justify-center font-bold text-lg text-blue-800">{(mod >= 0 ? '+' : '')}{mod}</div>
                    {/* 豁免熟练已经自动跟随职业，禁止手动勾选，展示总豁免加成 */}
                    <div className="flex items-center gap-1 justify-center font-bold">
                       <input type="checkbox" readOnly checked={isSaveProf} className="pointer-events-none accent-blue-800" />
                       <span className={isSaveProf ? 'text-blue-800' : 'text-gray-500'}>{(saveMod >= 0 ? '+' : '')}{saveMod}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

        </div>

        {/* 中侧：战斗信息 */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-cinzel border-b border-gray-400 pb-2 text-dnd-red-dark">战斗 (Combat)</h2>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-3 text-center border border-gray-300 rounded shadow-sm">
              <div className="text-xs font-bold text-gray-600 mb-1">熟练加值 (PB)</div>
              <div className="text-2xl font-bold text-red-800">+{profBonus}</div>
            </div>
            <div className="bg-white p-3 text-center border border-gray-300 rounded shadow-sm">
              <div className="text-xs font-bold text-gray-600 mb-1">先攻</div>
              <div className="text-2xl font-bold text-blue-800">{(dexMod >= 0 ? '+' : '')}{dexMod}</div>
            </div>
             <div className="bg-white p-3 text-center border border-gray-300 rounded shadow-sm">
              <div className="text-xs font-bold text-gray-600 mb-1">速度</div>
              <div className="text-2xl font-bold">30尺</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-2 border border-gray-300 rounded text-center">
               <div className="text-sm font-bold">护甲等级 (AC)</div>
               <div className="text-4xl font-bold text-blue-800 mt-2">{calculateAC()}</div>
             </div>
             <div className="bg-white p-2 border border-gray-300 rounded text-center">
               <div className="text-sm font-bold">最大生命值 (HP)</div>
               <div className="text-4xl font-bold text-red-800 mt-2">{Math.floor(hp)}</div>
             </div>
          </div>

          <div className="bg-white/40 border border-gray-300 p-3 rounded space-y-3">
            <h3 className="font-bold text-sm">装备栏</h3>
            <select value={equipment.armor} onChange={(e) => setEquipment({...equipment, armor: e.target.value})} className="input-dnd p-2 w-full text-sm">
                {Object.entries(ARMORS).map(([key, a]) => <option key={key} value={key}>{a.name} (AC: {a.baseAc})</option>)}
            </select>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
              <input type="checkbox" checked={equipment.shield} onChange={(e) => setEquipment({...equipment, shield: e.target.checked})} />
              手持盾牌 (+2 AC)
            </label>
          </div>

          <div className="bg-white text-gray-800 p-3 rounded border border-gray-300 shadow-sm flex justify-between items-center">
            <div>
              <div className="text-xs font-bold mb-1">法术/特殊能力 DC</div>
              <div className="text-sm">关键属性: {STATS.find(s=>s.id === spellStat).name}</div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{spellDC}</div>
          </div>
          
          <div className="text-sm font-bold bg-white border border-gray-300 p-2 rounded text-center">
            被动察觉: <span className="text-lg text-blue-800">{passivePerception}</span>
          </div>
        </div>

        {/* 右侧：额外信息 */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-cinzel border-b border-gray-400 pb-2 text-dnd-red-dark">外观与武装</h2>
          
          <div className="bg-[#e8deb8] border border-gray-300 p-4 rounded shadow-sm text-center">
            <h3 className="font-bold border-b border-gray-300 mb-3 pb-1 text-left">人物照片</h3>
            <label className="cursor-pointer block relative w-32 h-32 mx-auto mb-1 group">
              <img 
                src={basic.customPortrait || PORTRAITS[basic.race] || PORTRAITS["人类"]} 
                alt="角色肖像" 
                className="w-32 h-32 rounded-full border-4 border-gray-400 object-cover bg-white"
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-bold">点击上传</span>
                <span className="text-gray-300 text-xs">- 本地图片 -</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setBasic({...basic, customPortrait: event.target.result});
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
            {basic.customPortrait && (
               <button 
                  onClick={() => setBasic({...basic, customPortrait: ''})} 
                  className="text-xs text-red-600 hover:underline mt-1"
               >
                 清除自定义头像
               </button>
            )}
          </div>

          <div className="bg-[#e8deb8] border border-gray-300 p-4 rounded shadow-sm flex flex-col">
            <h3 className="font-bold border-b border-gray-300 mb-2 pb-1">武器装备</h3>
            <textarea 
              className="input-dnd text-sm p-2 w-full flex-grow min-h-[100px] resize-y" 
              placeholder="输入携带的武器，如：
长剑 (1d8 挥砍)
短弓 (1d6 穿刺)"
              value={equipment.weapons}
              onChange={e => setEquipment({...equipment, weapons: e.target.value})}
            />
          </div>

          <div className="bg-[#e8deb8] border border-gray-300 p-4 rounded shadow-sm flex flex-col">
            <h3 className="font-bold border-b border-gray-300 mb-2 pb-1">已知法术</h3>
            <textarea 
              className="input-dnd text-sm p-2 w-full flex-grow min-h-[120px] resize-y" 
              placeholder="输入熟知的法术（如有），例如：
戏法：火焰箭, 法师之手
1环：魔法飞弹, 护盾术"
              value={spells}
              onChange={e => setSpells(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 底部三列布局：职业特性、种族特性、技能 */}
      <div className="panel-dnd p-6 md:p-8 relative grid grid-cols-1 lg:grid-cols-3 gap-8 text-black">
        
        {/* 职业特性栏 */}
        <div>
          <div className="bg-[#8b2b2b] text-white text-center py-2 font-bold text-lg mb-0 border border-black border-b-0">
            职业特性
          </div>
          <table className="w-full text-center border-collapse border border-black text-sm bg-[#e8deb8]">
            <thead className="bg-[#f5eedc]">
              <tr className="text-[#0066cc]">
                <th className="border border-black py-1 px-2 w-12">LV</th>
                <th className="border border-black py-1 px-2 w-24">名称</th>
                <th className="border border-black py-1 px-2">描述</th>
              </tr>
            </thead>
            <tbody>
              {/* 渲染当前等级及之前的职业特性 */}
              {(() => {
                const cls = CLASSES[basic.charClass];
                let featuresList = [];
                for (let i = 1; i <= basic.level; i++) {
                  if (cls?.features[i]) {
                    const traits = cls.features[i].split(', ');
                    traits.forEach(trait => {
                      featuresList.push({ lv: i, name: trait.trim(), desc: `在等级 ${i} 获得的能力` });
                    });
                  }
                }
                // 填充空白行以保持表格高度
                while (featuresList.length < 15) {
                  featuresList.push({ lv: '', name: '', desc: '' });
                }
                return featuresList.map((f, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-[#f5eedc]" : "bg-[#ded2a5]"}>
                    <td className="border border-black p-1 h-7">{f.lv}</td>
                    <td className="border border-black p-1 h-7">{f.name}</td>
                    <td className="border border-black p-1 h-7 text-left">{f.desc}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* 种族特性、专长、特殊能力 一列 */}
        <div className="flex flex-col gap-6">
          
          <div>
            <div className="bg-[#8b2b2b] text-white text-center py-2 font-bold text-lg mb-0 border border-black border-b-0">
              种族特性
            </div>
            <table className="w-full text-center border-collapse border border-black text-sm bg-[#e8deb8]">
              <thead className="bg-[#f5eedc]">
                <tr className="text-[#0066cc]">
                  <th className="border border-black py-1 px-2 w-32">名称</th>
                  <th className="border border-black py-1 px-2">描述</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const traits = RACES[basic.race].traits.split('，');
                  let raceList = traits.map(t => ({ name: t.trim(), desc: "天生种族能力" }));
                  
                  // 填充尽量少的空白行避免过长
                  while (raceList.length < 5) {
                    raceList.push({ name: '', desc: '' });
                  }
                  return raceList.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-[#f5eedc]" : "bg-[#ded2a5]"}>
                      <td className="border border-black p-1 h-6">{r.name}</td>
                      <td className="border border-black p-1 h-6 text-left">{r.desc}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          <div>
            <div className="bg-[#8b2b2b] text-white text-center py-2 font-bold text-lg mb-0 border border-black border-b-0">
              专长 (Feats)
            </div>
            <table className="w-full text-center border-collapse border border-black text-sm bg-[#e8deb8]">
              <thead className="bg-[#f5eedc]">
                <tr className="text-[#0066cc]">
                  <th className="border border-black py-1 px-2 w-32">专长名称</th>
                  <th className="border border-black py-1 px-2">描述</th>
                </tr>
              </thead>
              <tbody>
                {/* 占位符，以后有真正专长系统可以渲染 */}
                <tr className="bg-[#f5eedc]">
                  <td className="border border-black p-1 h-6 text-gray-500 italic text-xs">暂无专长系统...</td>
                  <td className="border border-black p-1 h-6"></td>
                </tr>
                <tr className="bg-[#ded2a5]">
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                </tr>
                <tr className="bg-[#f5eedc]">
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1 h-6"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col flex-grow">
            <div className="bg-[#8b2b2b] text-white text-center py-2 font-bold text-lg mb-0 border border-black border-b-0">
              特殊能力
            </div>
            <textarea 
              className="w-full bg-[#f5eedc] border border-black p-2 text-sm outline-none resize-y min-h-[120px] focus:bg-white transition"
              placeholder="手动记录背景特性或其他特殊能力 (如：平民背景 - 寻本探源)..."
              value={specialAttrs}
              onChange={(e) => setSpecialAttrs(e.target.value)}
            />
          </div>

        </div>

        {/* 技能栏 - 缩小化 */}
        <div>
          <div className="bg-[#8b2b2b] text-white text-center py-2 font-bold text-lg mb-0 border border-black border-b-0">
            技能
          </div>
          <table className="w-full text-center border-collapse border border-black text-xs bg-[#e8deb8]">
            <thead className="bg-[#f5eedc]">
              <tr className="text-[#0066cc]">
                <th className="border border-black py-0.5 w-10">熟练</th>
                <th className="border border-black py-0.5 w-16">技能名</th>
                <th className="border border-black py-0.5">修正</th>
                <th className="border border-black py-0.5 w-8">&gt;</th>
                <th className="border border-black py-0.5 w-12 text-sm">总值</th>
              </tr>
            </thead>
            <tbody>
              {['str', 'dex', 'int', 'wis', 'cha'].map(statId => {
                const statSkills = SKILLS.filter(s => s.stat === statId);
                if (statSkills.length === 0) return null;
                
                const statName = STATS.find(s => s.id === statId).name;
                const header = (
                  <tr key={`header-${statId}`} className="bg-[#f5eedc]">
                    <td colSpan="5" className="border border-black py-0 text-[#0066cc] font-bold">
                      {statName}系
                    </td>
                  </tr>
                );
                
                const rows = statSkills.map(skill => {
                  const isProficient = proficiencies.skills[skill.id];
                  const baseMod = getFinalMod(skill.stat);
                  const totalMod = baseMod + (isProficient ? profBonus : 0);
                  
                  return (
                    <tr key={skill.id} className="bg-[#ded2a5] cursor-pointer hover:bg-white/50 transition">
                      <td className="border border-black p-0" onClick={() => toggleSkill(skill.id)}>
                        <div className={`w-full h-full flex justify-center items-center py-0 ${isProficient ? 'bg-[#e0e0e0]' : 'bg-[#99ccff]'}`}>
                          {isProficient ? 'O' : 'X'}
                        </div>
                      </td>
                      <td className="border border-black py-0 px-1 bg-[#a3a3a3] text-white font-bold" onClick={() => toggleSkill(skill.id)}>
                        <span className={isProficient ? 'text-[#ffcc00]' : 'text-white'}>{skill.name}</span>
                      </td>
                      <td className="border border-black p-0 bg-white">
                        <input className="w-full text-center outline-none bg-transparent" placeholder={`+${baseMod}`} readOnly />
                      </td>
                      <td className="border border-black py-0 bg-[#f5eedc]">{'>'}</td>
                      <td className="border border-black py-0 px-1 bg-[#ffffcc] font-bold text-base text-[#cc0000]">
                        {totalMod}
                      </td>
                    </tr>
                  );
                });
                
                return [header, ...rows];
              })}
            </tbody>
          </table>
        </div>

      </div>

      <div className="flex justify-center mt-6">
         <button onClick={handleSave} className="btn-dnd px-8 py-3 text-xl block shadow-md">
          保存角色卡
         </button>
      </div>

      {/* 已保存角色展示 */}
      <div className="panel-dnd p-6 mt-12 mb-12">
        <h2 className="text-xl font-bold font-cinzel mb-4 border-b border-gray-400 pb-2">我的角色</h2>
        {savedCards.length === 0 ? (
          <p className="italic text-center py-4 text-gray-500">没有保存的记录</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedCards.map(c => (
              <div 
                key={c.id} 
                className="bg-white border border-gray-300 p-4 relative group rounded shadow-sm hover:shadow-lg hover:border-[#8b2b2b] cursor-pointer transition-all"
                onClick={() => loadCharacter(c)}
              >
                <div>
                  <h3 className="font-bold text-xl mb-1 text-dnd-red-dark">{c.basic?.name || "未知"}</h3>
                  <p className="text-sm font-bold text-gray-600 mb-3">{c.basic?.race} / {c.basic?.charClass} / 等级 {c.basic?.level}</p>
                  <div className="flex gap-2 text-xs font-bold text-gray-700">
                    <span className="bg-blue-100 border border-blue-200 px-2 py-1 rounded">AC {c.ac}</span>
                    <span className="bg-red-100 border border-red-200 px-2 py-1 rounded">HP {c.hp}</span>
                    <span className="bg-gray-100 border border-gray-200 px-2 py-1 rounded">PB +{c.profBonus}</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止事件冒泡防止触发加载
                    handleDelete(c.id);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition z-10 bg-white px-2 py-1 border border-gray-300 rounded shadow-sm"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}