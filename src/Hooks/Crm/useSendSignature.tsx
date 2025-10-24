/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { WorkOrderService } from '@/Services/Crm/WorkOrderService';

export const useSendSignature = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const sendSignature = async (signatureDataURL: string, userId: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await WorkOrderService.sendSignature(signatureDataURL, userId);
      setData(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al enviar la firma.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendSignature, isLoading, error, data };
};
