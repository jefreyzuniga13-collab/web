/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from "react";
import type { ContactRequestDTO } from "@/Interfaces/Crm/ClientInterface";

export interface UseContactSectionArgs {
  clientId?: any;
  client: any;
  fetchContactsByClient: (clientId: any) => Promise<{ items?: any[] } | null | undefined>;
  linkExistingContactsAsync: (clientId: number, contactIds: number[]) => Promise<any>;
  reloadClient: () => Promise<void>;
  setClient: (updater: (prev: any) => any) => void;
}

export interface PickerContactItem {
  id: number;
  fullName?: string | null;
  phone?: string | null;
}

export interface UseContactSectionResult {
  contacts: any[];
  pickCtcOpen: boolean;
  setPickCtcOpen: (v: boolean) => void;
  newContact: ContactRequestDTO;
  setNewContact: (v: ContactRequestDTO) => void;
  contactPickerItems: PickerContactItem[];
  openContactPicker: () => Promise<void>;
  addPickedContact: () => Promise<void>;
}

/**
 * Maneja la asignación de contactos a un cliente existente.
 * Implementa carga dinámica, picker y vinculación en una sola fuente lógica.
 */
export const useContactSection = ({
  clientId,
  client,
  fetchContactsByClient,
  linkExistingContactsAsync,
  reloadClient,
  setClient,
}: UseContactSectionArgs): UseContactSectionResult => {
  const contacts = useMemo(() => {
    return ((client as any)?.clientContacts ?? []) as any[];
  }, [client]);

  const [pickCtcOpen, setPickCtcOpen] = useState(false);
  const [newContact, setNewContact] = useState<ContactRequestDTO>({
    contactId: 0,
    isActive: true,
  });
  const [contactPickerItems, setContactPickerItems] = useState<PickerContactItem[]>([]);

  const openContactPicker = useCallback(async () => {
    setPickCtcOpen(true);
    if (clientId != null) {
      const res = await fetchContactsByClient(clientId);
      if (res?.items) {
        setContactPickerItems(
          res.items.map((r: any) => ({
            id: r.id,
            fullName: r.fullName ?? r.name ?? "",
            phone: r.phone ?? "",
          }))
        );
      }
    }
  }, [clientId, fetchContactsByClient]);

  const addPickedContact = useCallback(async () => {
    if (!clientId || !newContact.contactId) return;
    await linkExistingContactsAsync(Number(clientId), [newContact.contactId]);
    setClient((prev: any) => {
      if (!prev) return prev;
      const list = Array.isArray(prev.clientContacts)
        ? [...prev.clientContacts]
        : [];
      const found = contactPickerItems.find(
        c => c.id === newContact.contactId
      );
      if (found) {
        list.unshift({
          id: found.id,
          fullName: found.fullName,
          phone: found.phone,
        });
      }
      return { ...prev, clientContacts: list };
    });
    await reloadClient();
    setNewContact({ contactId: 0, isActive: true });
    setPickCtcOpen(false);
  }, [
    clientId,
    newContact,
    linkExistingContactsAsync,
    reloadClient,
    setClient,
    contactPickerItems,
  ]);

  return {
    contacts,
    pickCtcOpen,
    setPickCtcOpen,
    newContact,
    setNewContact,
    contactPickerItems,
    openContactPicker,
    addPickedContact,
  };
};

export default useContactSection;