import {useState, useEffect} from 'react'
import {RolesServices} from '@/Services/RolesServices'
import type { RoleResponseDto } from '@/Interfaces/Auth/AuthInterface';

export function useRoles(){
    const [roles, setRoles] = useState<RoleResponseDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        setLoading(true);
        RolesServices.getRolesAsync()
        .then(setRoles)
        .catch(err=> setError(err.message))
        .finally(()=> setLoading(false))
    }, [])

    return {roles, loading, error};
    
}