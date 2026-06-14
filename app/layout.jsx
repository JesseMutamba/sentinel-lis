import './globals.css';

export const metadata = {
  title: 'Sentinel LIS | Corridor Intelligence Platform',
  description: 'Freight corridor intelligence and risk analysis platform for southern and eastern Africa.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
