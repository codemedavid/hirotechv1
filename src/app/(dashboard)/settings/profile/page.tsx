import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/settings/profile-form';
import { PasswordForm } from '@/components/settings/password-form';
import { EmailForm } from '@/components/settings/email-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Separator />

      <div className="grid gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your profile photo and personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={session.user} />
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>

        {/* Change Email */}
        <Card>
          <CardHeader>
            <CardTitle>Change Email</CardTitle>
            <CardDescription>
              Update your email address for account notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailForm currentEmail={session.user.email} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

