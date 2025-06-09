
import React, { useState, useEffect } from 'react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/CustomButton';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select } from '@/Components/ui/select';
import type { SystemParamRequestDto, SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface";
import '@/Styles/Setting/SystemParamForm.css'
interface SystemParamFormProps {
  initialData?: SystemParamResponseDto;
  onSubmit: (data: SystemParamRequestDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SystemParamForm: React.FC<SystemParamFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    description: '',
    type: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeOptions = [
    { value: 'Prompts', label: 'Prompts' },
    { value: 'Keywords', label: 'Keywords' },
    { value: 'Temp', label: 'Temp' }
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        value: initialData.value || '',
        description: initialData.description || '',
        type: initialData.type || '',
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del parámetro es obligatorio';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'El valor es obligatorio';
    }

    if (!formData.type) {
      newErrors.type = 'El tipo es obligatorio';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }));
    if (errors.type) {
      setErrors(prev => ({ ...prev, type: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData: SystemParamRequestDto = {
      id: initialData?.id || 0,
      name: formData.name,
      value: formData.value,
      description: formData.description,
      type: formData.type,
    };

    onSubmit(submitData);
  };

  return (
    <form className="system-param-form" onSubmit={handleSubmit}>
      <div className="system-param-form__container">
        <div className="system-param-form__section">
          <h3 className="system-param-form__section-title">Información del Parámetro</h3>
          
          <div className="system-param-form__grid">
            <div className="system-param-form__field">
              <Label htmlFor="name" className="system-param-form__label">
                Nombre del Parámetro *
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className={`system-param-form__input ${errors.name ? 'system-param-form__input--error' : ''}`}
                placeholder="Ej: max_connections"
              />
              {errors.name && (
                <span className="system-param-form__error">{errors.name}</span>
              )}
            </div>

            <div className="system-param-form__field">
              <Label htmlFor="type" className="system-param-form__label">
                Tipo *
              </Label>
              <Select
                value={formData.type}
                onValueChange={handleSelectChange}
                options={typeOptions}
                placeholder="Seleccione un tipo"
                disabled={isLoading}
                error={!!errors.type}
                className={errors.type ? 'system-param-form__select--error' : ''}
              />
              {errors.type && (
                <span className="system-param-form__error">{errors.type}</span>
              )}
            </div>

            <div className="system-param-form__field system-param-form__field--full">
              <Label htmlFor="value" className="system-param-form__label">
                Valor *
              </Label>
              <Textarea
                id="value"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                className={`system-param-form__textarea ${errors.value ? 'system-param-form__textarea--error' : ''}`}
                placeholder="Valor del parámetro"
                rows={4}
                error={!!errors.value}
                disabled={isLoading}
              />
              {errors.value && (
                <span className="system-param-form__error">{errors.value}</span>
              )}
            </div>

            <div className="system-param-form__field system-param-form__field--full">
              <Label htmlFor="description" className="system-param-form__label">
                Descripción *
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`system-param-form__textarea ${errors.description ? 'system-param-form__textarea--error' : ''}`}
                placeholder="Describe el propósito de este parámetro..."
                rows={3}
                error={!!errors.description}
                disabled={isLoading}
              />
              {errors.description && (
                <span className="system-param-form__error">{errors.description}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="system-param-form__actions">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="system-param-form__button system-param-form__button--cancel"
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          className="system-param-form__button system-param-form__button--submit"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : (initialData ? 'Actualizar Parámetro' : 'Crear Parámetro')}
        </Button>
      </div>
    </form>
  );
};

export default SystemParamForm;