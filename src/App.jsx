import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import CharacterCreator from './pages/CharacterCreator';
import RoomLobby from './pages/RoomLobby';
import GameRoom from './pages/GameRoom';
import Login from './pages/Login';

function NavBar() {
  const location = useLocation();
  // 在登录页 "/" 时，隐藏顶部导航栏，让登录框显得更加居中且独立
  if (location.pathname === '/') return null;

  return (
    <nav className="bg-gradient-to-b from-[#111] to-[#222] border-b-2 border-dnd-gold shadow-[0_4px_15px_rgba(0,0,0,0.8)] p-4 relative z-20">
      <div className="flex gap-8 max-w-5xl mx-auto items-center">
        {/* Logo/标题区域使用古典或者衬线字体 */}
        <h1 className="text-3xl font-bold font-cinzel text-dnd-gold tracking-wider drop-shadow-[0_2px_2px_rgba(184,148,86,0.3)] select-none cursor-default">
          D&D 
          <span className="text-xl ml-2 text-dnd-parchment font-serif align-middle">剑湾传说</span>
        </h1>
        <div className="flex gap-4 font-cinzel text-lg tracking-wide">
          <Link to="/creator" className="text-gray-300 hover:text-dnd-gold transition-colors duration-300">角色大厅</Link>
          <Link to="/lobby" className="text-gray-300 hover:text-dnd-gold transition-colors duration-300">战役信标</Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-dnd-dark bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] text-dnd-parchment font-serif flex flex-col selection:bg-dnd-red selection:text-white">
        <NavBar />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 z-10 relative">
          <div className="absolute inset-0 pointer-events-none pattern-overlay opacity-30"></div>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/creator" element={<CharacterCreator />} />
            <Route path="/lobby" element={<RoomLobby />} />
            <Route path="/room/:roomId" element={<GameRoom />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;