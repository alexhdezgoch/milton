import { useState } from 'react'
import { Plus, X, Tag as TagIcon, Check } from 'lucide-react'

const TAG_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
]

export default function TagPicker({
  selectedTags = [],
  availableTags = [],
  onAddTag,
  onRemoveTag,
  onCreateTag,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [creating, setCreating] = useState(false)

  const selectedTagIds = selectedTags.map(t => t.id)
  const unselectedTags = availableTags.filter(t => !selectedTagIds.includes(t.id))

  const handleAddTag = async (tag) => {
    await onAddTag?.(tag.id)
    // Don't close - allow adding multiple
  }

  const handleRemoveTag = async (tagId) => {
    await onRemoveTag?.(tagId)
  }

  const handleCreateTag = async (e) => {
    e.preventDefault()
    if (!newTagName.trim() || creating) return

    setCreating(true)
    try {
      const newTag = await onCreateTag?.(newTagName.trim(), newTagColor)
      if (newTag) {
        await onAddTag?.(newTag.id)
      }
      setNewTagName('')
      setNewTagColor(TAG_COLORS[0])
      setShowCreateForm(false)
    } catch (err) {
      console.error('Failed to create tag:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: tag.color || '#6B7280' }}
          >
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-text-secondary bg-bg-secondary hover:bg-bg-tertiary transition-colors border border-border"
        >
          <Plus className="w-3 h-3" />
          Add tag
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false)
              setShowCreateForm(false)
            }}
          />

          {/* Dropdown Menu */}
          <div className="absolute z-50 mt-2 w-64 bg-white rounded-xl shadow-lg border border-border overflow-hidden">
            {!showCreateForm ? (
              <>
                {/* Available Tags */}
                <div className="max-h-48 overflow-y-auto">
                  {unselectedTags.length > 0 ? (
                    <div className="p-2">
                      {unselectedTags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => handleAddTag(tag)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-secondary transition-colors text-left"
                        >
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tag.color || '#6B7280' }}
                          />
                          <span className="text-sm text-text-primary truncate">{tag.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-text-muted">No more tags available</p>
                    </div>
                  )}
                </div>

                {/* Create New Tag Button */}
                <div className="border-t border-border p-2">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-secondary transition-colors text-left"
                  >
                    <Plus className="w-4 h-4 text-accent-green" />
                    <span className="text-sm text-accent-green font-medium">Create new tag</span>
                  </button>
                </div>
              </>
            ) : (
              /* Create Tag Form */
              <form onSubmit={handleCreateTag} className="p-4">
                <div className="mb-3">
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Tag name</label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name"
                    autoFocus
                    className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Color</label>
                  <div className="flex gap-2">
                    {TAG_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewTagColor(color)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          newTagColor === color ? 'ring-2 ring-offset-2 ring-text-primary scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {newTagName && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Preview</label>
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: newTagColor }}
                    >
                      {newTagName}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewTagName('')
                    }}
                    className="flex-1 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTagName.trim() || creating}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-accent-green rounded-lg hover:bg-accent-green/90 transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  )
}
