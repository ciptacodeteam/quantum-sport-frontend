import AdminChangePasswordForm from '@/components/admin/forms/AdminChangePasswordForm';
import AppSectionHeader from '@/components/ui/app-section-header';

const ProfilePage = () => {
  return (
    <main>
      <AppSectionHeader
        withBorder
        title="Pengaturan Kata Sandi"
        description="Ubah kata sandi akun admin Anda secara berkala untuk menjaga keamanan."
      />

      <main>
        <section>
          <AdminChangePasswordForm />
        </section>
      </main>
    </main>
  );
};
export default ProfilePage;
