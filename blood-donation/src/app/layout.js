import { Noto_Nastaliq_Urdu, Plus_Jakarta_Sans } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";
import BootstrapInit from "@/components/BootstrapInit";
import DemoBanner from "@/components/DemoBanner";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  weight: "400",
  display: "swap",
});

export const metadata = {
  title: {
    default: `${APP_NAME} — Blood donors across Pakistan`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_TAGLINE,
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${plusJakarta.variable} ${nastaliq.variable} h-100`}>
      <body className="d-flex flex-column min-vh-100">
        <BootstrapInit />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <DemoBanner />
        <Navbar user={user} />
        <div id="main-content" className="flex-grow-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
