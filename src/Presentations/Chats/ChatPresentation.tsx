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
           image='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQn9zilY2Yu2hc19pDZFxgWDTUDy5DId7ITqA&s'
          pendding={3}
        />
        <Message
          name="jefrey zuniga"
          key={1}
          lastMessgae="Buenas dias, estimado."
          time="8:00 P.M"
           image='https://plus.unsplash.com/premium_photo-1683121366070-5ceb7e007a97?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D'
          pendding={3}
        />
        <Message
          name="jefrey zuniga"
          key={1}
          lastMessgae="Buenas dias, estimado."
          time="8:00 P.M"
          image='https://blog.texasbar.com/files/2011/12/housto-bankruptcy-attorney-adam-schachter1.jpg'
          pendding={3}
        />
        <Message
          name="jefrey zuniga"
          key={1}
          lastMessgae="Buenas dias, estimado."
          time="8:00 P.M"
           image='https://media.istockphoto.com/id/1437816897/photo/business-woman-manager-or-human-resources-portrait-for-career-success-company-we-are-hiring.jpg?s=612x612&w=0&k=20&c=tyLvtzutRh22j9GqSGI33Z4HpIwv9vL_MZw_xOE19NQ='
          pendding={3}
        />
      </section>
              <ClientData/>
    </section>
  );
};

export default ChatPresentation;
