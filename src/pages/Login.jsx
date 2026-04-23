import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginGuest, saveSession } from '../lib/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      alert("请输入你的名字，勇敢的冒险者！");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await loginGuest(username.trim());
      saveSession(session);
      navigate('/creator');
    } catch (error) {
      alert(error?.message || '登录失败，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh]">
      <div className="bg-[#e8deb8] p-10 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.9)] border-4 border-[#8b2b2b] max-w-md w-full text-dnd-dark font-serif relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#8b2b2b]"></div>
        
        <h2 className="text-3xl font-bold font-cinzel text-center text-dnd-red-dark mb-2">
          D&D 剑湾传说
        </h2>
        <p className="text-center text-gray-700 font-bold border-b-2 border-gray-400 pb-4 mb-6">
          — 冒险者酒馆大门 —
        </p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block font-bold mb-2 text-gray-800">冒险者代号：</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 input-dnd bg-white border border-gray-400 rounded focus:border-[#8b2b2b] focus:ring-1 focus:ring-[#8b2b2b] outline-none transition"
              placeholder="输入任意代号登录..." 
            />
          </div>
          <div>
            <label className="block font-bold mb-2 text-gray-800">通行口令：</label>
            <input 
              type="password" 
              className="w-full p-3 input-dnd bg-white border border-gray-400 rounded focus:border-[#8b2b2b] focus:ring-1 focus:ring-[#8b2b2b] outline-none transition"
              placeholder="（目前无需校验，随便输）" 
            />
          </div>
          
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#8b2b2b] text-[#f5eedc] font-bold py-3 text-lg rounded hover:bg-red-800 transition shadow-md border-2 border-[#f5eedc] mt-4"
          >
            {isSubmitting ? '正在开门...' : '推门进入酒馆'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>无需真实注册，仅作为前端身份标识。</p>
        </div>
      </div>
    </div>
  );
}