
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface JWTPayload {
  role?: string | string[];
  sub?: string;
  nameid?: string;
  email?: string[];
  jti?: string;
}

export function useUserRoles() {
  const [roles, setRoles] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupport, setIsSupport] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }
    
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      
      let userRoles: string[] = [];
      if (decoded.role) {
        userRoles = Array.isArray(decoded.role) ? decoded.role : [decoded.role];

      }
      setRoles(userRoles);
    
      // Determinar si es admin o support
      setIsAdmin(userRoles.includes('Admin'));
      setIsSupport(userRoles.includes('Support'));
      
      setUserId(decoded.sub || decoded.nameid || '');
    } catch (error) {
      console.error('Error al decodificar el token JWT:', error);
    }
  }, []);

  return { 
    roles,
    userId, 
    isAdmin, 
    isSupport,
  };
}