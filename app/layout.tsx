import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "react-toastify";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Xpertance | Pre-Primary ERP System",
  description:
    "Xpertance Pre-Primary ERP System for managing admissions, students, teachers, attendance, fees, payroll, and academic operations efficiently.",
  keywords: [
    "Xpertance",
    "Pre-Primary ERP",
    "School ERP",
    "Education Management System",
    "Student Management",
    "Teacher Management",
    "Fees Management",
    "Payroll System",
    "Parent Portal",
    "Student Tracking",
  ],
  authors: [{ name: "Xpertance" }],
  creator: "Xpertance",
  applicationName: "Xpertance Pre-Primary ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </AuthProvider>
      </body>
    </html>
  );
}
