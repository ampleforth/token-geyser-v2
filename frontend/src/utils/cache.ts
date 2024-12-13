export const set = (key: string, value: any, ttl: number) => {
  const data = { value, expiresAt: new Date().getTime() + ttl }
  localStorage.setItem(key, JSON.stringify(data))
}

export const get = (key: string): any => {
  const data = localStorage.getItem(key)
  // console.log("cache hit", !!data, key)
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

export async function computeAndCache<T>(
  getValueOperation: () => Promise<T>,
  key: string,
  ttl: number,
  useCache: (cached: T) => boolean = () => true,
): Promise<T> {
  const cachedValue = get(key)
  if (cachedValue && useCache(cachedValue)) return cachedValue
  const value = await getValueOperation()
  set(key, value, ttl)
  return value
}
