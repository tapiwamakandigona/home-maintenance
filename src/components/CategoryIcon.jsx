import {
  Leaf,
  Sparkles,
  Sprout,
  TreePine,
  Wrench,
  Zap,
  Paintbrush,
  Droplets,
  Truck,
  Hammer,
} from 'lucide-react'

// Presentational only: maps a category slug/name to a brand line icon,
// replacing the emoji stored in the category document.
const RULES = [
  [/grass|lawn|mow/i, Leaf],
  [/maid|clean|domestic|house/i, Sparkles],
  [/garden/i, Sprout],
  [/tree|fell/i, TreePine],
  [/plumb|pipe|water/i, Droplets],
  [/electric|power/i, Zap],
  [/paint/i, Paintbrush],
  [/mov|transport|deliver/i, Truck],
  [/repair|fix|handy/i, Wrench],
]

export function categoryIcon(category) {
  const key = [category?.slug, category?.name].filter(Boolean).join(' ')
  for (const [re, Icon] of RULES) {
    if (re.test(key)) return Icon
  }
  return Hammer
}

export default function CategoryIcon({ category, ...props }) {
  const Icon = categoryIcon(category)
  return <Icon className="icon" aria-hidden="true" {...props} />
}
