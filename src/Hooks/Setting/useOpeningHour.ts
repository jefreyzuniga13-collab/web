/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { OpeningHourService } from "@/Services/Config/OpeningHourService";
import type { OpeningHourInterface } from "@/Interfaces/Setting/OpeningHour";

export const useOpeningHour = () => {
  const [openingHours, setOpeningHours] = useState<OpeningHourInterface[]>([]);
  const [selectedOpeningHour, setSelectedOpeningHour] =
    useState<OpeningHourInterface | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const getOpeningHours = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await OpeningHourService.getOpeningHourAsync();
      setOpeningHours(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const getOpeningHourById = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await OpeningHourService.getOpennigHourByIdAsync(id);
      setSelectedOpeningHour(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpeningHourStatus = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await OpeningHourService.toggleOpeningHourStatusAsync(id);
      setOpeningHours((prev) =>
        prev.map((item) => (item.id == updated.id ? updated : item))
      );
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const createOpeningHour = async (openingHour: OpeningHourInterface) => {
    setLoading(true);
    setError(null);
    try {
      const newItem = await OpeningHourService.createOpeningHourAsync(
        openingHour
      );
      setOpeningHours((prev) => [...prev, newItem]);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateOpeningHour = async (openingHour: OpeningHourInterface) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await OpeningHourService.updateOpennigHourAsync(
        openingHour
      );
      setOpeningHours((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    openingHours,
    selectedOpeningHour,
    loading,
    error,
    getOpeningHours,
    createOpeningHour,
    updateOpeningHour,
    getOpeningHourById,
    toggleOpeningHourStatus,
  };
};