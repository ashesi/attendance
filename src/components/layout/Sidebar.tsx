import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, Users, BarChart3, LogOut,
  GraduationCap, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAppStore } from '../../store'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../lib/utils'
import { useState } from 'react'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

const facultyNav: NavItem[] = [
  { label: 'My Courses', to: '/faculty/courses', icon: <BookOpen size={18} /> },
]

const adminNav: NavItem[] = [
  { label: 'Overview', to: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'All Courses', to: '/admin/courses', icon: <BookOpen size={18} /> },
  { label: 'Students', to: '/admin/students', icon: <Users size={18} /> },
  { label: 'Reports', to: '/admin/reports', icon: <BarChart3 size={18} /> },
]

export function Sidebar() {
  const { role, userName, logout } = useAppStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const nav = role === 'faculty' ? facultyNav : adminNav

  const roleLabel = {
    student: 'Student',
    faculty: 'Faculty Intern',
    admin: 'Administrator',
  }

  const roleAccent = {
    student: 'text-success',
    faculty: 'text-accent',
    admin: 'text-warning',
  }

  const handleLogout = () => {
    logout()
    navigate('/staff')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex-shrink-0 h-screen flex flex-col bg-bg-surface border-r border-bg-border overflow-hidden"
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-bg-border flex-shrink-0',
        collapsed && 'justify-center px-0'
      )}>
        <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
          <GraduationCap size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-sm font-bold text-ink-primary leading-none">Ashesi</p>
              <p className="text-xs text-ink-muted leading-none mt-0.5">Attendance</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated',
                collapsed && 'justify-center px-0 w-10 mx-auto'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('flex-shrink-0', isActive ? 'text-accent' : 'text-ink-muted group-hover:text-ink-secondary')}>
                  {item.icon}
                </span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className={cn(
        'border-t border-bg-border p-3 flex-shrink-0',
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-bg-elevated transition-colors group">
            <Avatar name={userName || 'User'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink-primary truncate">{userName}</p>
              <p className={cn('text-xs', role ? roleAccent[role] : 'text-ink-muted')}>{role ? roleLabel[role] : ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-ink-muted hover:text-danger rounded-lg hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-2 text-ink-muted hover:text-danger rounded-xl hover:bg-danger/10 transition-all"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}
