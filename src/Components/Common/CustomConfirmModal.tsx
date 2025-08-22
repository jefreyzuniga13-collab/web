import Button from '@/Components/Common/Button'
import '@/Styles/Common/CustomConfirmModal.css'

interface Props {
    title: string;
    subtitle: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const CustomConfirmModal = ({ title, subtitle, onConfirm, onCancel }: Props) => {

    return (
        <section className="ccm-container">
            <div className='ccm-header-container'>
                <h3 className="ccm-title">{title}</h3>
                <p className="ccm-subtitle">{subtitle}</p>
            </div>

            <div className="ccm-buttons">
                <Button
                    onClick={() => onConfirm}
                    variant='primary'
                    value={'Confirmar'}
                />
                <Button
                    onClick={() => onCancel}
                    value={'Cancelar'}
                    variant='secondary'
                />
            </div>
        </section>
    )
}