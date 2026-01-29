import { Home, Tag, Search, Scissors, X } from 'lucide-react'

function LeftSidebar({
  onClose,
  activeNav,
  onNavChange
}) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'tags', icon: Tag, label: 'Tags' },
    { id: 'search', icon: Search, label: 'Search' },
  ]

  return (
    <aside className="w-[220px] h-screen bg-bg-primary border-r border-border flex flex-col shadow-sidebar">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Scissors className="w-5 h-5 text-accent-rose transform -rotate-45" />
          </div>
          <span className="text-lg font-semibold text-accent-green tracking-tight">Milton</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 -mr-2 hover:bg-bg-secondary rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-1 flex-1">
        {navItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onNavChange(item.id)}
            className={`sidebar-item ${activeNav === item.id ? 'sidebar-item-active' : ''}`}
          >
            <item.icon className="w-[18px] h-[18px]" />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default LeftSidebar
