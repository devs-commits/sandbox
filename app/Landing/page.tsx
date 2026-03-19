import Navbar from "../components/Navbar";
import HeroSection from "../components/landing/HeroSection";
import CompanyLogoWall from "../components/landing/CompanyLogoWall";
import CareerPathQuiz from "../components/landing/CareerPathQuiz";
import ROICalculator from "../components/landing/ROICalculator";

const Landing = () => {
  return (
 <div className="min-h-screen bg-[hsla(207,36%,95%,1)]">
  <Navbar />
  <HeroSection />
  <CompanyLogoWall />
  <CareerPathQuiz />
  <ROICalculator />
 </div>
  )
};

export default Landing;