import type { Metadata } from 'next';
import './globals.css';
import { profile } from '@/data/portfolio';
export const metadata: Metadata = {
  title: `${profile.name} — Aspiring DevOps Engineer`,
  description: 'Ritik Kumar — DevOps fresher learning AWS, Linux and shell scripting. Explore S3 hosting, CloudFront, EC2, Route 53, DNS, TLS and automation projects.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
