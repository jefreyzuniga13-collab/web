import { useState, useEffect, useCallback, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { contactService } from '@/Services/Contact/ContactService'
import type {
  ContactLogInterface,
  ClienteResponseDto,
  ClienteDetalleResponseDto
} from '@/Interfaces/Contact/ContactInterface'

type FormErrors = {
  fullName?: string
  idCard?: string
  passport?: string
  residenceCard?: string
  codcli?: string
  codigo?: string
}

export function useVerifyNewContact(phoneNumber: string) {
  const navigate = useNavigate()

  const [contact, setContact] = useState<ContactLogInterface | null>(null)
  const [clientes, setClientes] = useState<ClienteResponseDto[]>([])
  const [detalle, setDetalle] = useState<ClienteDetalleResponseDto | null>(null)
  const [filter, setFilter] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    idType: 'NationalCard' as ContactLogInterface['idType'],
    idCard: '',
    passport: '',
    residenceCard: '',
    codcli: '',
    companyName: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    contactService.getContactByPhoneAsync(phoneNumber)
      .then(data => {
        setContact(data)
        setForm({
          fullName: data.fullName ?? '',
          idType: data.idType,
          idCard: data.idCard ?? '',
          passport: data.passport ?? '',
          residenceCard: data.residenceCard ?? '',
          codcli: '',
          companyName:  data.companyName ?? ''
          
        })
      })
      .catch(() => toast.error('No se encontró el contacto'))
  }, [phoneNumber])

  const handleFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setFilter(value)
      if (value.trim()) {
        contactService.searchClientesAsync(value)
          .then(setClientes)
          .catch(() => toast.error('Error al buscar clientes'))
      } else {
        setClientes([])
        setDetalle(null)
      }
    },
    []
  )

  const handleChangeText = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      setForm(f => ({ ...f, [name]: value }))
    },
    []
  )

  const handleSelectCliente = useCallback(
    async (e: ChangeEvent<HTMLSelectElement>) => {
      const codcli = e.target.value
      setForm(f => ({ ...f, codcli }))
      try {
        const det = await contactService.getClienteDetailsAsync(codcli)
        setDetalle(det)
      } catch {
        toast.error('Error al obtener detalles de cliente')
      }
    },
    []
  )

  const handleChangeCodigo = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const codigo = parseInt(e.target.value, 10) || 0
      setForm(f => ({ ...f, codigo }))
    },
    []
  )

  const handleBack = useCallback(() => {
    navigate('/chat')
  }, [navigate])

  const handleSubmit = useCallback(async () => {

    const newErrors: FormErrors = {}
    if (!form.fullName.trim()) newErrors.fullName = 'Nombre completo requerido'
    
    //Ejemplos formatos validos 0010022112360Q o 123-456789-0123A
   if (
  form.idType === 'NationalCard' &&
  !/^(\d{3}-\d{6}-\d{4}[A-Z]|\d{13}[A-Z])$/.test(form.idCard)
    ) {
      newErrors.idCard = 'Formato de cédula inválido';
    }

    
    if (form.idType === 'Passport' && !/^[A-Z]{1,2}\d{7}$/.test(form.passport))
      newErrors.passport = 'Formato de pasaporte inválido'
    if (form.idType === 'ResidenceCard' && !/^(?:[A-Z]{1,2}\d{7}|\d{1,12})$/.test(form.residenceCard))
      newErrors.residenceCard = 'Formato de residencia inválido'
    if (!form.codcli) newErrors.codcli = 'Seleccione un cliente'
    // if (form.codigo <= 0) newErrors.codigo = 'Ingrese código válido'
    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      if (contact) {
        await contactService.updateContactAsync({
          ...contact,
          fullName: form.fullName,
          idType: form.idType,
          idCard: form.idCard,
          passport: form.passport,
          residenceCard: form.residenceCard
        })
      }
      await contactService.verifyAndLinkAsync(
        contact?.id ?? 0,
        form.codcli
      )
      toast.success('Contacto verificado')
      navigate('/chat')
    } catch {
      toast.error('Error al verificar contacto')
    } finally {
      setLoading(false)
    }
  }, [form, contact, navigate])

  return {
    contact,
    clientes,
    detalle,
    filter,
    form,
    errors,
    loading,
    handleFilterChange,
    handleChangeText,
    handleSelectCliente,
    handleChangeCodigo,
    handleSubmit,
    handleBack
  }
}