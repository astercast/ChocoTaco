import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Reset scroll position on route changes (SPA pages were opening at the footer). */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
