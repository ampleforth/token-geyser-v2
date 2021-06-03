export const set = (key: string, value: any, ttl: number) => {
  const data = { value, expiresAt: new Date().getTime() + ttl }
  localStorage.setItem(key, JSON.stringify(data))
}

export const get = (key: string): any => {
  const data = localStorage.getItem(key)
  if (data !== null) {
    const { value, expiresAt } = JSON.parse(data)
    if (expiresAt && expiresAt < new Date().getTime()) {
      localStorage.removeItem(key)
    } else {
      return value
    }
  }
  return null
}
