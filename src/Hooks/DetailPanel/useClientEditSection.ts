/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import type { ClientUpdateRequestDTO } from "@/Interfaces/Crm/ClientInterface";


/**
 * Maneja el estado y la lógica para editar datos del cliente.
 * Centraliza los campos editables en un solo objeto y expone
 * setters generales y la función de guardado.
 */
export interface UseClientEditSectionResult {
  clientEditOpen: boolean;
  setClientEditOpen: (v: boolean) => void;
  clientEdit: ClientUpdateRequestDTO;
  handleChange: <K extends keyof ClientUpdateRequestDTO>(
    field: K,
    value: ClientUpdateRequestDTO[K]
  ) => void;
  handleNumberChange: (field: keyof ClientUpdateRequestDTO, value: string) => void;
  saveClientEdits: () => Promise<void>;
}

export const useClientEditSection = (
  clientLocal: any,
  clientId: number | undefined,
  updateClientAsync: (id: number, dto: Partial<ClientUpdateRequestDTO>) => Promise<any>,
  reloadClient: () => Promise<void>
): UseClientEditSectionResult => {
  const [clientEditOpen, setClientEditOpen] = useState(false);

  const [clientEdit, setClientEdit] = useState<ClientUpdateRequestDTO>({
    workModel: clientLocal?.workModel ?? "",
    priority: clientLocal?.priority ?? "",
    supportType: clientLocal?.supportType ?? "",
    enviromentType: clientLocal?.enviromentType ?? "",
    isSupportActive: !!clientLocal?.isSupportActive,
    isFranchise: !!clientLocal?.isFranchise,
    supportLimitTime: clientLocal?.supportLimitTime ?? null,
    observation: clientLocal?.observation ?? "",
  });

  useEffect(() => {
    setClientEdit({
      workModel: clientLocal?.workModel ?? "",
      priority: clientLocal?.priority ?? "",
      supportType: clientLocal?.supportType ?? "",
      enviromentType: clientLocal?.enviromentType ?? "",
      isSupportActive: !!clientLocal?.isSupportActive,
      isFranchise: !!clientLocal?.isFranchise,
      supportLimitTime: clientLocal?.supportLimitTime ?? null,
      observation: clientLocal?.observation ?? "",
    });
  }, [clientLocal, clientEditOpen]);

  const handleChange = useCallback(
    <K extends keyof ClientUpdateRequestDTO>(field: K, value: ClientUpdateRequestDTO[K]) => {
      setClientEdit(prev => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleNumberChange = useCallback(
    (field: keyof ClientUpdateRequestDTO, value: string) => {
      setClientEdit(prev => ({
        ...prev,
        [field]: value === "" ? null : Number(value),
      }));
    },
    []
  );

  const saveClientEdits = useCallback(async () => {
    if (!clientId) return;

    const patch: Partial<ClientUpdateRequestDTO> = {
      workModel: clientEdit.workModel,
      priority: clientEdit.priority,
      supportType: clientEdit.supportType,
      enviromentType: clientEdit.enviromentType,
      isSupportActive: clientEdit.isSupportActive,
      isFranchise: clientEdit.isFranchise,
      supportLimitTime: clientEdit.supportLimitTime ?? null,
      observation: clientEdit.observation,
    };

    await updateClientAsync(clientId, patch);
    await reloadClient();
    setClientEditOpen(false);
  }, [clientId, clientEdit, updateClientAsync, reloadClient]);

  return {
    clientEditOpen,
    setClientEditOpen,
    clientEdit,
    handleChange,
    handleNumberChange,
    saveClientEdits,
  };
};