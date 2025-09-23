import useContact from '@/Hooks/Contact/useContact';
import { useInnova } from '@/Hooks/useInnova';
import { useState } from 'react';

export const useDetailPanel = (contactId?: number) => {
    const [optionMenu, setOptionMenu] = useState<number>(1)

    //Cagar datos al mostrar el modal
    const {selectedData, loading, error} = 
    useContact(contactId);

    const {client, setClient, getByIdAsync} = 
    useInnova()

    

  return {
    selectedData,
    loading,
    error,
    client,
    setClient,
    getByIdAsync,
    optionMenu,
    setOptionMenu
  }
}