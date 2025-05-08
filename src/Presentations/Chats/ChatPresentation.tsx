import Message from "@/Components/Common/Message";
import Menu from "@/Components/Common/Menu";
import "@/Styles/Common/Message.css";
import "@/Styles/Chat/ChatPresentation.css";
import ClientData from '@/Presentations/Chats/ClientData'

const ChatPresentation = () => {
  return (
    <section className="inbox-container">
      <Menu />
      <section className="message-hightContainer">
        <Message
          name="jefrey zuniga"
          key={1}
          lastMessgae="Buenas dias, estimado."
          time="8:00 P.M"
          image='https://i.ibb.co/tpfwg3xW/user-Profile.jpg'
          pendding={3}
        />
        <Message
          name="jefrey zuniga"
          key={1}
          lastMessgae="Buenas dias, estimado."
          time="8:00 P.M"
           image='https://i.ibb.co/tpfwg3xW/user-Profile.jpg'
          pendding={3}
        />
        <Message
          name="jefrey zuniga"
          key={1}
          lastMessgae="Buenas dias, estimado."
          time="8:00 P.M"
           image='https://i.ibb.co/tpfwg3xW/user-Profile.jpg'
          pendding={3}
        />
        <Message
          name="jefrey zuniga"
          key={1}
          lastMessgae="Buenas dias, estimado."
          time="8:00 P.M"
          image='https://i.ibb.co/tpfwg3xW/user-Profile.jpg'
          pendding={3}
        />
        <Message
          name="jefrey zuniga"
          key={1}
          lastMessgae="Buenas dias, estimado."
          time="8:00 P.M"
           image='https://i.ibb.co/tpfwg3xW/user-Profile.jpg'
          pendding={3}
        />
      </section>
              <ClientData/>
    </section>
  );
};
export default ChatPresentation;
