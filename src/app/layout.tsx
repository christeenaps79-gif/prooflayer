export const metadata = {
  title: "ProofLayer",
  description: "AI governance control plane for verifiable decision execution.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
