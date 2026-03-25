import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, ArrowLeftRight,
  Gauge, Wrench, ClipboardCheck, Droplets,
  X, ChevronLeft, ChevronRight, LogOut, Sun, Moon, Settings, History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { useTranslation } from 'react-i18next';

// ─── Single nav item ───────────────────────────────────────────────────────
function NavItem({ item, isActive, isCollapsed, onMobileClose }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      title={isCollapsed ? item.label : undefined}
      onClick={() => { if (window.innerWidth < 1024) onMobileClose(); }}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg py-2 text-[13px] font-medium',
        'transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/60',
        isCollapsed ? 'lg:justify-center lg:px-0 px-3' : 'px-3',
        isActive
          ? 'bg-zinc-100 text-zinc-900'
          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-[7px] bottom-[7px] w-[3px] rounded-r-full bg-[#2563EB]" />
      )}
      <Icon className={cn(
        'flex-shrink-0 transition-colors duration-150',
        isCollapsed ? 'lg:w-[18px] lg:h-[18px] w-4 h-4' : 'w-4 h-4',
        isActive ? 'text-[#2563EB]' : 'text-zinc-400 group-hover:text-zinc-700'
      )} />
      <span className={cn('truncate leading-none select-none', isCollapsed && 'lg:hidden')}>
        {item.label}
      </span>
    </Link>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────
export default function Sidebar({ open, onToggle }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const navGroups = [
    {
      label: null,
      items: [
        { label: t('nav.dashboard'), path: '/Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: t('nav.fleet'),
      items: [
        { label: t('nav.vehicles'),    path: '/Vehicles',    icon: Truck },
        { label: t('nav.drivers'),     path: '/Drivers',     icon: Users },
        { label: t('nav.assignments'), path: '/Assignments', icon: ArrowLeftRight },
      ],
    },
    {
      label: t('nav.operations'),
      items: [
        { label: t('nav.mileage'),      path: '/Mileage',     icon: Gauge },
        { label: t('nav.maintenance'),  path: '/Maintenance', icon: Wrench },
        { label: t('nav.inspections'),  path: '/Inspections', icon: ClipboardCheck },
        { label: t('nav.washings'),     path: '/Washings',    icon: Droplets },
      ],
    },
  ];

  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  );

  function toggleCollapse() {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }

  function isActive(path) {
    return (
      location.pathname === path ||
      (path !== '/Dashboard' && location.pathname.startsWith(path))
    );
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full flex flex-col',
          'bg-white border-r border-zinc-100',
          'transition-all duration-300 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-[260px] lg:w-[64px]' : 'w-[260px]'
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center h-[56px] px-3 gap-2 border-b border-zinc-100 flex-shrink-0">
          <div className={cn('flex items-center gap-2.5 flex-1 min-w-0', isCollapsed && 'lg:hidden')}>
            <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm shadow-[#2563EB]/20">
              <Truck className="w-[13px] h-[13px] text-white" />
            </div>
            <div className="min-w-0 leading-none">
              <p className="text-[13px] font-semibold text-zinc-900 tracking-tight">FleetDesk</p>
              <p className="text-[10px] text-zinc-400 mt-[2px]">{t('common.fleetManagement')}</p>
            </div>
          </div>

          <button
            onClick={toggleCollapse}
            aria-label={t(isCollapsed ? 'nav.expandSidebar' : 'nav.collapseSidebar')}
            className={cn(
              'hidden lg:flex items-center justify-center h-8 rounded-lg',
              'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100',
              'transition-colors duration-150 flex-shrink-0',
              isCollapsed ? 'flex-1' : 'w-8'
            )}
          >
            {isCollapsed
              ? <ChevronRight className="w-[14px] h-[14px]" />
              : <ChevronLeft className="w-[14px] h-[14px]" />
            }
          </button>

          <button
            className="lg:hidden text-zinc-400 hover:text-zinc-800 transition-colors p-1"
            onClick={onToggle}
            aria-label={t('nav.closeSidebar')}
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-1' : ''}>
              {group.label && (
                <>
                  <p className={cn(
                    'px-2.5 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.08em]',
                    'text-zinc-400 select-none leading-none',
                    isCollapsed && 'lg:hidden'
                  )}>
                    {group.label}
                  </p>
                  <div className={cn(
                    'hidden my-2 mx-1 border-t border-zinc-100',
                    isCollapsed && 'lg:block'
                  )} />
                </>
              )}
              <div className="space-y-[2px]">
                {group.items.map(item => (
                  <NavItem
                    key={item.path}
                    item={item}
                    isActive={isActive(item.path)}
                    isCollapsed={isCollapsed}
                    onMobileClose={onToggle}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div className={cn(
          'flex-shrink-0 border-t border-zinc-100 px-4 py-3 space-y-2',
          isCollapsed && 'lg:px-2'
        )}>
          <p className={cn('text-[10px] text-zinc-400 font-medium select-none', isCollapsed && 'lg:hidden')}>
            v1.0
          </p>
          <Link
            to="/Activity"
            onClick={() => { if (window.innerWidth < 1024) onToggle() }}
            className={cn(
              'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-xs font-medium',
              'transition-colors',
              isActive('/Activity')
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50',
              isCollapsed && 'lg:justify-center lg:px-0'
            )}
          >
            <History className={cn('w-[14px] h-[14px] flex-shrink-0', isActive('/Activity') ? 'text-[#2563EB]' : '')} />
            <span className={cn(isCollapsed && 'lg:hidden')}>Activité</span>
          </Link>
          <Link
            to="/Settings"
            onClick={() => { if (window.innerWidth < 1024) onToggle() }}
            className={cn(
              'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-xs font-medium',
              'transition-colors',
              isActive('/Settings')
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50',
              isCollapsed && 'lg:justify-center lg:px-0'
            )}
          >
            <Settings className={cn('w-[14px] h-[14px] flex-shrink-0', isActive('/Settings') ? 'text-[#2563EB]' : '')} />
            <span className={cn(isCollapsed && 'lg:hidden')}>{t('nav.settings')}</span>
          </Link>
          <button
            onClick={signOut}
            className={cn(
              'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-xs font-medium',
              'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors',
              isCollapsed && 'lg:justify-center lg:px-0'
            )}
          >
            <LogOut className="w-[14px] h-[14px] flex-shrink-0" />
            <span className={cn(isCollapsed && 'lg:hidden')}>{t('nav.signOut')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
