import { useState, useEffect } from "react";
import { useUsers } from "@/Hooks/User/useUsers";
import type { UpdateUserRequest } from "@/Interfaces/User/UserInterfaces";

export function useProfileCard() {
  const { currentUser, loading, fetchOne } = useUsers();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<UpdateUserRequest>({
    fullName: "",
    email: "",
    isActive: true,
    companyId: 1,
    phone: "",
    identifier: "",
    roleIds: [],
  });

  const authRaw = localStorage.getItem("auth") || "{}";
  const { userId } = JSON.parse(authRaw);

  useEffect(() => {
    if (!currentUser) {
      fetchOne(Number(userId));
    }
  }, [currentUser, fetchOne, userId]);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone || "",
        identifier: currentUser.identifier || "",
        isActive: currentUser.isActive,
        companyId: currentUser.companyId,
        roleIds: currentUser.roles.map((role) => role.roleId),
      });
    }
  }, [currentUser]);

  const handleEdit = () => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone || "",
        identifier: currentUser.identifier || "",
        isActive: currentUser.isActive,
        companyId: currentUser.companyId,
        roleIds: currentUser.roles.map((role) => role.roleId),
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (currentUser) {
      // const updateData = { ...formData };
      if (selectedFile) {
        // manejar la subida de la imagen
      }
      // handleUpdateUser(currentUser.userId, updateData);
      setIsEditing(false);
      setSelectedFile(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone || "",
        identifier: currentUser.identifier || "",
        isActive: currentUser.isActive,
        companyId: currentUser.companyId,
        roleIds: currentUser.roles.map((role) => role.roleId),
      });
    }
  };

  const handleInputChange = (
    field: keyof UpdateUserRequest,
    value: string | boolean | number | number[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  return {
    loading,
    isEditing,
    formData,
    currentUser,
    handleEdit,
    handleSave,
    handleCancel,
    handleInputChange,
    handleFileSelect,
  };
}