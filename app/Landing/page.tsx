import Navbar from "../components/Navbar";
import HeroSection from "../components/landing/HeroSection";
import ProblemSection from "../components/landing/ProblemSection";
import CompanyLogoWall from "../components/landing/CompanyLogoWall";
import CareerPathQuiz from "../components/landing/CareerPathQuiz";
import ROICalculator from "../components/landing/ROICalculator";
import CareerComparisonMatrix from "../components/landing/CareerComparisonMatrix";
import CurriculumTransparency from "../components/landing/CurriculumTransparency";
import OutcomesSection from "../components/landing/OutcomesSection";
import ChatSectionV3 from "../components/landing/ChatSectionV3";
import VideoTestimonials from "../components/landing/VideoTestimonials";
import { AIOFaqSection } from "../components/landing/AIOFaqSection";
import PricingSection from "../components/landing/PricingSection";
import WaitlistSection from "../components/landing/WaitlistSection";
import TrustBand from "../components/landing/TrustBand";
import FaqSection from "../components/landing/FaqSection";
import FooterSection from "../components/landing/FooterSection";

const Landing = () => {
  return (
 <div className="min-h-screen bg-[hsla(207,36%,95%,1)] pt-16">
  <Navbar />
  <HeroSection />
  <ProblemSection />
  <CompanyLogoWall />
  <CareerPathQuiz />
  <ROICalculator />
  <CareerComparisonMatrix />
  <CurriculumTransparency />
  <OutcomesSection />
  <ChatSectionV3 />
  <VideoTestimonials />
  <AIOFaqSection />
  <PricingSection />
  <WaitlistSection />
  <TrustBand />
  <FaqSection />
  <FooterSection />
 </div>
  )
};

export default Landing;