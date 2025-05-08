import Button from "@/Components/Common/Button";
import { FaChrome, FaCloud } from "react-icons/fa";
import "@/Styles/Chat/ClientData.css";

const ClientData = () => {
  return (
    
    <section className="clientData-container">
      <div className="clientData-header">
        <img
        src="https://i.ibb.co/tpfwg3xW/user-Profile.jpg"
        alt="profile-image"
        className="clienData-profileImage"
      />
      <div className="clientData-info">
        <p className="clientData-Name">Beth Johnson</p>
        <span className="clientData-email">beth@gmail.com</span>
        <p className="client-country">Nicaragua</p>
      </div>
      </div>
      
      <Button variant="primary" type="button" className="clientData-button">
        View Profile
      </Button>

      <div className="clientData-content">
        <div className="clientData-visitorDevices">
          <p>
            <FaChrome />
            Firefox 131 on Windows
          </p>
          <p>
            <FaCloud /> 151.29.148.118
          </p>
        </div>

        <div className="clientData-accountInformation">
          <p className="accountInformation">
            ticket-categoria
            <span className="accountInformation-data">support</span>
          </p>
          <p className="accountInformation">
            account-status
            <span className="accountInformation-data">locked</span>
          </p>
          <p className="accountInformation">
            last-login
            <span className="accountInformation-data">2025-02-12</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ClientData;