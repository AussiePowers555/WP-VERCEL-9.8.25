import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Login - PBikeRescue',
  description: 'Sign in to PBikeRescue',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="login-layout">
      {children}
    </div>
  );
}