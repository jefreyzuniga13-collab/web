import { useEffect, useState } from "react"
import '@/Styles/Crm/ClientManagementPanel.css'
import { useClasicClient } from "@/Hooks/Crm/useClasicClient"
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import { Label } from '@/Components/Common/Label'
import { Textarea } from '@/Components/Common/Textarea'
import Select from '@/Components/Common/Select'
import { useParams } from "react-router-dom"

const supportTypeOptions = [
    { value: '', label: 'Seleccione tipo soporte' },
    { value: 'AAA', label: 'AAA' },
    { value: 'AA', label: 'AA' },
    { value: 'A', label: 'A' },
]

const enviromentOptions = [
    { value: '', label: 'Seleccione el embiente' },
    { value: 'Nube', label: 'Nube' },
    { value: 'Local', label: 'Local' },
]

const priorityOptions = [
    { value: '', label: 'Seleccione el embiente' },
    { value: 'Alta', label: 'Alta' },
    { value: 'Media', label: 'Media' },
    { value: 'Baja', label: 'Baja' }
]

const ClientManagementPanel = () => {

    //Obtener el id del cliente que se obtiene. Se recibe string.
    const {id} = useParams<string>();
    const [tabs, setTabs] = useState<number>(1)
    const [isEdit, setIsEdit] = useState<boolean>(false)

    const {
        fetchById,
        loading,
        handleChange,
        handleSelect,
        handleCheckbox,
        // error,
        form
    } = useClasicClient();

    useEffect(() => {
        fetchById(Number(id))
    }, [id, fetchById])


    if (loading) return <p>...</p>

    return (
        <section className="clientManagementPanel-container">

            <header className="clientManagementPanel-header">
                <div onClick={() => setTabs(1)} className="clientManagementPanel-header__tab">
                    <p className="clientManagementPanel-header__text" >Datos Generales</p>
                </div>
                <div onClick={() => setTabs(2)} className="clientManagementPanel-header__tab">
                    <p className="clientManagementPanel-header__text" >Credenciales</p>
                </div>
                <div onClick={() => setTabs(3)} className="clientManagementPanel-header__tab">
                    <p className="clientManagementPanel-header__text" >Equipos</p>
                </div>
                <div onClick={() => setTabs(4)} className="clientManagementPanel-header__tab">
                    <p className="clientManagementPanel-header__text" >Sistemas</p>
                </div>
                <div onClick={() => setTabs(5)} className="clientManagementPanel-header__tab">
                    <p className="clientManagementPanel-header__text" >Contactos</p>
                </div>
            </header>

            <section>
                {tabs === 1 && (
                    <div className="modal__grid">
                        <div className="role-modal__col">
                            <Label htmlFor="workModel" className="role-modal__label">Modelo de trabajo</Label>
                            <Input
                                id="workModel"
                                name="workModel"
                                value={form.workModel!}
                                onChange={handleChange}
                                disabled={!isEdit}
                                className="role-modal__input"
                            />
                            {/* {error.roleName && <div className="role-modal__error">{errors.roleName}</div>} */}
                        </div>

                        <div className="modal__col">
                            <Label htmlFor="supportLimitTime" className="role-modal__label">Limite de soporte</Label>
                            <Input
                                id="supportLimitTime"
                                name="supportLimitTime"
                                value={form.supportLimitTime!}
                                onChange={handleChange}
                                disabled={!isEdit}
                                className="role-modal__input"
                            />
                            {/* {error.roleName && <div className="role-modal__error">{errors.roleName}</div>} */}
                        </div>

                        <div className="modal__col">
                            <Label htmlFor="observation" className="role-modal__label">Observación</Label>
                            <Textarea
                                id="observation"
                                name="observation"
                                value={form.observation!}
                                onChange={handleChange}
                                disabled={!isEdit}
                                className="role-modal__input"
                            />
                            {/* {error.roleName && <div className="role-modal__error">{errors.roleName}</div>} */}
                        </div>

                        <div className="modal__col">
                            <Label htmlFor="supportType" className="sp-modal__label">
                                Tipo soporte
                            </Label>
                            <Select
                                id="supportType"
                                value={form.supportType!}
                                onChange={(e) => handleSelect(e.target.value)}
                                options={supportTypeOptions}
                                disabled={!isEdit}
                                className="sp-modal__select"
                            />
                        </div>

                        <div className="modal__col">
                            <Label htmlFor="supportType" className="sp-modal__label">
                                Tipo soporte
                            </Label>
                            <Select
                                id="supportType"
                                value={form.priority!}
                                onChange={(e) => handleSelect(e.target.value)}
                                options={priorityOptions}
                                disabled={!isEdit}
                                className="sp-modal__select"
                            />
                        </div>

                        <div className="modal__col">
                            <Label htmlFor="enviromentType" className="sp-modal__label">
                                Tipo soporte
                            </Label>
                            <Select
                                id="enviromentType"
                                value={form.enviromentType!}
                                onChange={(e) => handleSelect(e.target.value)}
                                options={enviromentOptions}
                                disabled={!isEdit}
                                className="sp-modal__select"
                            />
                        </div>

                        <div className="modal__col">
                            <Label htmlFor="isSupportActive">Tiene soporte activo</Label>
                            <input
                                type="checkbox"
                                id="isSupportActive"
                                name="isSupportActive"
                                checked={form.isSupportActive}
                                onChange={handleCheckbox}
                                disabled={!isEdit}
                            />
                        </div>

                        <div className="modal__col">
                            <Label htmlFor="isFranchise">Es franquisia</Label>
                            <input
                                type="checkbox"
                                id="isFranchise"
                                name="isFranchise"
                                checked={form.isFranchise}
                                onChange={handleCheckbox}
                                disabled={!isEdit}
                            />
                        </div>

                        <div className="modal__col">
                            <Button
                                variant="secondary"
                                onClick={() => setIsEdit(!isEdit)}
                                className="role-modal__btn role-modal__btn--cancel"
                                type="button"
                            >
                                {isEdit ? 'Cancelar' : 'Editar'}
                            </Button>
                        </div>


                    </div>
                )}

                {tabs === 2 && (
                    <div className="modal__grid">

                    </div>
                )}

                {tabs == 3 && (
                    <>

                    </>
                )}

                {tabs == 4 && (
                    <>

                    </>
                )}

                {tabs == 5 && (
                    <>

                    </>
                )}
            </section>
        </section>
    )
}

export default ClientManagementPanel