import { useState, useEffect, useCallback } from "react"

export function useKV<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === "undefined") return initialValue
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((current) => {
          const valueToStore = value instanceof Function ? value(current) : value
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
            window.dispatchEvent(new CustomEvent(`storage-${key}`, { detail: valueToStore }))
          }
          return valueToStore
        })
      } catch {
        // quota exceeded or fallback
      }
    },
    [key]
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<T>
      setStoredValue(customEvent.detail)
    }

    const handleWindowStorage = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener(`storage-${key}`, handleStorageChange)
    window.addEventListener("storage", handleWindowStorage)
    return () => {
      window.removeEventListener(`storage-${key}`, handleStorageChange)
      window.removeEventListener("storage", handleWindowStorage)
    }
  }, [key])

  return [storedValue, setValue]
}
