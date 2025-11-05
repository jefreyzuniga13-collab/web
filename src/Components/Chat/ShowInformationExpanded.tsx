import type React from "react"
import '@/Styles/Chat/showInformationExpanded.css'
import { IoClose } from "react-icons/io5";

interface Props {
    title: string;
    content: string | null | undefined
    setIsshowInformationExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}
const ShowInformationExpanded: React.FC<Props> = ({
    title,
    content,
    setIsshowInformationExpanded
}) => {
    return (
        <section className="showInformationExpanded__overlay ">
            <div className="showInformationExpanded__container">

                <span className="showInformationExpanded__icons">
                    <IoClose fontSize={16}
                        onClick={() => {
                            setIsshowInformationExpanded(false)
                        }} />
                </span>
                <h3 className="showInformationExpanded__title">{title}</h3>
                <p className="showInformationExpanded__text">
                    {content}
                </p>
            </div>
        </section>
    )
}

export default ShowInformationExpanded