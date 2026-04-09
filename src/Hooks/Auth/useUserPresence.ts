import { useEffect, useState } from 'react'
import { userService } from '@/Services/auth/UserService'
import { presenceConnection } from '@/Services/signalr'
import { HubConnectionState } from '@microsoft/signalr'

export function useUserPresence(userId: number) {
  const [isOnline, setIsOnline] = useState(false)
  const [lastOnline, setLastOnline] = useState<Date | null>(null)

  useEffect(() => {
    if (!userId) return

    userService.getUserPresence(userId)
      .then(dto => {
        setIsOnline(dto.data.isOnline)
        setLastOnline(dto.data.lastOnline ? new Date(dto.data.lastOnline) : null)
      })
      .catch(console.error)
  }, [userId])

  // Suscripción a eventos SignalR
  useEffect(() => {
    if (!userId) return

    const onOnline = (id: number) => {
      if (id === userId) setIsOnline(true)
    }
    const onOffline = (id: number) => {
      if (id === userId) {
        setIsOnline(false)
        setLastOnline(new Date())
      }
    }

    presenceConnection?.on('UserIsOnline', onOnline)
    presenceConnection?.on('UserIsOffline', onOffline)

    return () => {
      presenceConnection?.off('UserIsOnline', onOnline)
      presenceConnection?.off('UserIsOffline', onOffline)
    }
  }, [userId])

  return { isOnline, lastOnline }
}

export async function markOffline(userId: number) {
  if (!presenceConnection) return;

  if (presenceConnection.state !== HubConnectionState.Connected) {
    // eslint-disable-next-line no-empty
    try { await presenceConnection.start(); } catch {}
  }
  await presenceConnection.invoke('UserDisconnected', userId); // método del Hub
}