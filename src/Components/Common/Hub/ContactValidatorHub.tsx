import type { RootState } from '@/Context';
import { useDispatch, useSelector } from 'react-redux'
import { ModalPopup, type ModalAction } from './ModalPopup';
import { closePopup, openPopup } from '@/Context/Slices/popupSlice';
import { useNavigate } from 'react-router-dom'

const ContactValidator = () => {

     const navigate = useNavigate()
    const dispatch = useDispatch();
    const {isOpen, event} = useSelector((state: RootState) => state.popup)

    if(!event || event.type != "newContactValidation") return null;
    
    const {waName, createdAt, isVerified, phone} = event.payload;

    console.log("Datos obtenidos desde el nuevo usuario", waName, createdAt, isVerified)
    const handleOpen = ()=> dispatch(openPopup(event));
     const handleClose = () => dispatch(closePopup())
    const handleSubmit = () => {

         navigate(`/verify-contact/${phone}`);
         dispatch(closePopup());
    }
    
    const actions: ModalAction[] = [
        {
            label: "Verificar",
            onClick: handleSubmit,
            variant: 'primary'
        },
    ];

    return (
        <>
            {!isOpen && (
               <div className="support-requested-bubble" onClick={handleOpen}>
                    🛎️
                </div>
            )}
            
            <ModalPopup 
                title='Nuevo contacto'
                message = {`Nuevo contacto ${waName} se ha registrado ${new Date(createdAt).toLocaleTimeString()}. Por favor verificar sus datos. Estado actual ${isVerified ? "Verificado": "Sin verificar"}`}
                actions={actions}
                isOpen={isOpen}
                onClose={handleClose}

            />
        </>
  )
}

export default ContactValidator;
