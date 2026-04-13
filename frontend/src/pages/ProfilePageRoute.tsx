import ProfilePage from '../components/profile/ProfilePage';

/**
 * Profile route page — renders the ProfilePage component full-width
 * (no sidebar).
 */
const ProfilePageRoute = () => {
  return (
    <main className="flex-1 relative bg-background-dark overflow-hidden">
      <ProfilePage />
    </main>
  );
};

export default ProfilePageRoute;
