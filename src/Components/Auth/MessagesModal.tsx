export type MessageType = 'Error' | "Success" | 'Warning' | 'Info';
import  './MessagesModal.css'
import { AiOutlineCheckCircle } from "react-icons/ai";
export interface Props{
    message: string;
    details?: string;
    type: MessageType
};

const MessagesModal = ({message, type, details}: Props) => {
    return (
    <div className={`messagesModal-container ${type}`}>
        <h3 className="messagesModal-title">
            <AiOutlineCheckCircle />
            {message}</h3>
        <p className="messagesModal-details">{details}</p>
    </div>
  )
}

export default MessagesModal;