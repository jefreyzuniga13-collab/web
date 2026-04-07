import { useState, useEffect } from "react";
import { useUsers } from "@/Hooks/Auth/useUsers";
import type { UpdateUserRequest } from "@/Interfaces/Auth/UserInterfaces";
import { toast } from "react-toastify";
import { userService } from "@/Services/auth/UserService";

export function useProfileCard() {
  const { currentUser, loading, fetchOne } = useUsers();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)

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


  //Subir imagen de usuario
     const handleUploadOnlyImage = async () => {
      if (!currentUser?.userId) {
          toast.warning('No se encontró el ID del usuario.' )
        return
      }
      if (!selectedFile) {
        toast.warning('Seleccione una imagen antes de actualizar.' )
        return
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.warning( 'La imagen no puede superar los 5MB' );
        return
      }
       try{
         const res = await userService.uploadUserAvatar(currentUser.userId, selectedFile)
  
        const newUrl = res.data.imageUrl ?? res.data.imageUrl ?? ''
        setFormData(prev => ({ ...prev, imageUrl: newUrl }))
        toast.success("Foto de perfil actualizada con éxito.")
       // eslint-disable-next-line @typescript-eslint/no-unused-vars
       }catch
       { 
        toast.error("Foto de perfil no actualizada")
       }finally{
        setUploadingImage(false);
       }
    }

  const handleSave = async () => {
    if (!currentUser?.userId) {
      toast.warning("No se encontró el ID del usuario.");
      return;
    }

    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      toast.warning("La imagen no puede superar los 5MB");
      return;
    }

    const fd = new FormData();
    fd.append("fullName", String(formData.fullName ?? ""));
    fd.append("email", String(formData.email ?? ""));
    fd.append("phone", String(formData.phone ?? ""));
    fd.append("identifier", String(formData.identifier ?? ""));
    fd.append("isActive", String(Boolean(formData.isActive)));
    fd.append("companyId", String(formData.companyId ?? 0));
    (formData.roleIds ?? []).forEach((id) => fd.append("roleIds", String(id)));
    if (selectedFile) fd.append("file", selectedFile);

    try {

      // handleUploadOnlyImage();
      await userService.updateUserAsync(currentUser.userId, fd as unknown as UpdateUserRequest);
      toast.success("Perfil actualizado correctamente");
      setIsEditing(false);
      setSelectedFile(null);
      fetchOne(currentUser.userId);
    } catch {
      toast.error("No se pudo actualizar el perfil");
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
      [field]: value as never,
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
    handleUploadOnlyImage,
    uploadingImage
  };
}
