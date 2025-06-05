
import React from 'react';
import '@/Styles/Setting/Profile.css'
import ProfileCard from '@/Components/Setting/ProfileCard'

const Profile: React.FC = () => {
  return (
    <div className="profile">
      <div className="profile__container">
        <div className="profile__content">
          <ProfileCard />
        </div>
      </div>
    </div>
  );
};

export default Profile;