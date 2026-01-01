
import React from 'react';
import '@/Styles/Auth/Profile.css'
import ProfileCard from '@/Components/Auth/ProfileCard'

const Profile: React.FC = () => {
  return (
    <div className="profile-page">
      <div className="profile-page__container">
        
        <div className="profile-page__content">
          <ProfileCard />
        </div>
      </div>
    </div>
  );
};

export default Profile;