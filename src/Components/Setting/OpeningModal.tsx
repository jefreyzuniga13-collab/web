import {useOpeningHour} from '@/Hooks/Setting/useOpeningHour'
import Input from '@/Components/Common/Input';

interface Prop{
    id: number;
}
export const OpeningModal: React.FC<Prop> = ({id}) => {
    const [isShow, setIsShow] = useState(false)
    const {loading, error, selectedOpeningHour, getOpeningHours} = useOpeningHour();


    return (
    <div className='openingHour-container'>
        <p>Detales de horario</p>
        <span>Creare un nuevo horario seleccione las opciones</span>
        
        <div className='openingHour-content'>
        <Input 
           id="email"
              name="email"
              type="email"
              placeholder={t("forgotPassword.emailPlaceholder")}
              value={formik.values.email}
            //   onChange={}
              />
        </div>
    </div>
  )
}
