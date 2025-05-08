import * as React from "react";
import { useTranslation } from "react-i18next";
import '@/Styles/Common/Message.css'

interface ChatProps {
  image: string;
  name: string;
  lastMessgae: string;
  pendding: number;
  time: string;
//   tooltip: string;
}

const Message: React.FC<ChatProps> = ({
  image,
  name,
  lastMessgae,
  pendding,
  time,
}) => {
  const { t } = useTranslation();

  return (
    <section className="message-container">
      <div className="message-leftInformation">
        <img src={image} alt={t("message.title")} className="message-image" />

      <div className="box-container one">
        <p className="message-name">{name}</p>
        <span className="message-lastmessage">{lastMessgae}</span>
      </div>
      </div>
      
      <div className="box-container">
        <span className="message-time">{time}</span>
        <span className="message-pending">{pendding}</span>
      </div>
    </section>
  );
};

export default Message;