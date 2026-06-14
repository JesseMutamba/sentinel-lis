import './globals.css';

export const metadata = {
  title: 'Lumnia | Corridor Intelligence',
  description: 'Lumnia turns fragmented freight data into corridor intelligence for southern and eastern Africa.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
