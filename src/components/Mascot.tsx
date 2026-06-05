import { motion } from 'framer-motion'
import { IMAGES } from '../constants/images'

type MascotProps = {
  className?: string
  size?: number
  float?: boolean
}

export default function Mascot({ className = '', size = 120, float = true }: MascotProps) {
  const img = (
    <img
      src={IMAGES.mascot}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={`mascot select-none ${className}`}
      aria-hidden
    />
  )

  if (!float) return img

  return (
    <motion.div
      className="inline-block"
      animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {img}
    </motion.div>
  )
}
