import AdminChangeProfileForm from '@/components/admin/forms/AdminChangeProfileForm';
import AppSectionHeader from '@/components/ui/app-section-header';

const ProfilePage = () => {
  return (
    <main>
      <AppSectionHeader
        withBorder
        title="Akun Saya"
        description="Kelola informasi akun admin Anda di sini."
      />

      <main>
        <section>
          <AdminChangeProfileForm />
        </section>
      </main>
    </main>
  );
};
export default ProfilePage;
