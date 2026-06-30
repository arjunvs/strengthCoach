import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/workout', label: 'Workout' },
  { to: '/progress', label: 'Progress' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
];

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="hidden md:flex items-center gap-6 border-b border-zinc-800 bg-zinc-950 px-6 py-3">
      <span className="text-lg font-bold text-white">StrengthCoach</span>
      <div className="flex items-center gap-1 ml-4">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-zinc-400">{user?.name}</span>
        <button
          onClick={logout}
          className="text-sm text-zinc-500 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
