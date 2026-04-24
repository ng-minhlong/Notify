import { Navbar } from "./_components/Navbar";
import "./globals.css"
const LandingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="dark:bg-dark min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default LandingLayout;