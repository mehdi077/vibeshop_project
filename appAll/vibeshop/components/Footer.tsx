import Link from "next/link";
import Image from "next/image";
import logo from "@/public/images/Market_big_logo.png";

const Footer = () => {
  return (
    <footer className="w-full bg-[#535357] text-white pt-8 pb-4">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 ">
          {/* Logo and About Section */}
          <div className="space-y-4 bg-white rounded-lg p-4">
            <Link href="/">
              <Image
                src={logo}
                alt="Vibe Shop"
                className="object-contain h-[50px] w-auto"
                priority
              />
            </Link>
            <p className="text-sm text-[#535357]">
              Votre marketplace de confiance en Algérie pour acheter et vendre en toute sécurité.
            </p>
          </div>
          
          
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-700 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-300">
              © 2024 MarketDZ. Tous droits réservés.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="/terms" className="text-sm text-gray-300 hover:text-white transition">
                {"Conditions d'utilisation"}
              </Link>
              <Link href="/privacy" className="text-sm text-gray-300 hover:text-white transition">
                Politique de confidentialité
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 