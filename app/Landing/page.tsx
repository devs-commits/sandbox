import Navbar from "../components/Navbar";
import HeroSection from "../components/landing/HeroSection";
import CompanyLogoWall from "../components/landing/CompanyLogoWall";
import CareerPathQuiz from "../components/landing/CareerPathQuiz";

const Landing = () => {
  return (
 <div className="min-h-screen bg-[hsla(207,36%,95%,1)]">
  <Navbar />
  <HeroSection />
  <CompanyLogoWall />
  <CareerPathQuiz />
 </div>
  )
};

export default Landing;