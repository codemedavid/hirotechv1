import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="w-full max-w-md px-6">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-200">
              <Image 
                src="/logo.svg" 
                alt="Hiro Logo" 
                width={56} 
                height={56}
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-3xl font-bold tracking-tight">Hiro<sup className="text-sm font-semibold">tech</sup></span>
            </div>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground text-center">Business Messaging Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}

