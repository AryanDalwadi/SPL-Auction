import { useEffect, useState } from 'react'

export function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const savedValue = window.localStorage.getItem(key)
      if (savedValue !== null) {
        return JSON.parse(savedValue)
      }
    } catch (error) {
      console.error(`Failed to parse localStorage key: ${key}`, error)
    }

    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch (error) {
      console.error(`Failed to save localStorage key: ${key}`, error)
    }
  }, [key, state])

  return [state, setState]
}
