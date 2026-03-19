import Navbar from "../components/Navbar";
import HeroSection from "../components/landing/HeroSection";
import ProblemSection from "../components/landing/ProblemSection";
import CompanyLogoWall from "../components/landing/CompanyLogoWall";
import CareerPathQuiz from "../components/landing/CareerPathQuiz";
import ROICalculator from "../components/landing/ROICalculator";
import CareerComparisonMatrix from "../components/landing/CareerComparisonMatrix";
import CurriculumTransparency from "../components/landing/CurriculumTransparency";
import OutcomesSection from "../components/landing/OutcomesSection";

const Landing = () => {
  return (
 <div className="min-h-screen bg-[hsla(207,36%,95%,1)]">
  <Navbar />
  <HeroSection />
  <ProblemSection />
  <CompanyLogoWall />
  <CareerPathQuiz />
  <ROICalculator />
  <CareerComparisonMatrix />
  <CurriculumTransparency />
  <OutcomesSection />
 </div>
  )
};

export default Landing;