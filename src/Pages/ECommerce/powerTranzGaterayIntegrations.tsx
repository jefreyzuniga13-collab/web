import type { SystemParamRequestDto } from '@/Interfaces/Auth/AuthInterface'
import {useState} from 'react'

export const powerTranzGaterayIntegrations = () => {
  
  const [loading, setLoading] = useState<boolean>(false)
  const [error, seterror] = useState<Error | null>(null)
  const [data, setData] = useState<SystemParamRequestDto>();
  
    return (
    <section>

    </section>
  )
}
