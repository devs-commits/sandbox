"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import actdLogo from "../../public/actd-logos.png";
import wdcLogo from "../../public/wdc-logo copy.jpg";
import wdcLabsLogo from "../../public/wdc_labs_logo.png";

const tracks = {
  marketing: {
    label: "Digital Marketing",
    role: "Growth Associate",
    task: "Build a 30-day launch plan for a Nigerian fintech product.",
    deliverables: ["Channel strategy", "Content calendar", "Budget allocation"],
    tool: "Campaign strategy",
  },
  analytics: {
    label: "Data Analytics",
    role: "Junior Data Analyst",
    task: "Find the cause of a 14% revenue decline in a retail dataset.",
    deliverables: ["Cleaned dataset", "Dashboard", "Executive recommendation"],
    tool: "Excel · SQL · Power BI",
  },
  security: {
    label: "Cybersecurity",
    role: "Security Operations Analyst",
    task: "Investigate a simulated account takeover and prepare an incident report.",
    deliverables: ["Incident timeline", "Risk assessment", "Response plan"],
    tool: "Security investigation",
  },
};

type TrackKey = keyof typeof tracks;
type AiFaq = {
  question: string;
  answer: string;
};

const trackOrder = Object.keys(tracks) as TrackKey[];

const faqs = [
  [
    "Is the first assignment really free?",
    "Yes. You can choose a track, complete one workplace assignment and receive a performance review before deciding whether to continue.",
  ],
  [
    "Do I need previous experience?",
    "No. Each track supports beginners, while the tasks become progressively more challenging as you build confidence.",
  ],
  [
    "How much time should I set aside?",
    "Plan for about 8-12 focused hours per week. You can work around your schedule, but every assignment has a realistic deadline.",
  ],
  [
    "What will be in my portfolio?",
    "Your portfolio contains selected completed assignments, your decisions, final outputs and verified feedback, not generic course certificates.",
  ],
  [
    "Does WDC Labs guarantee a job?",
    "No programme can guarantee employment. WDC Labs helps you build practical evidence, stronger interview stories and the ability to demonstrate how you work.",
  ],
  [
    "How does payment work after the free task?",
    "Continue with Monthly Flex at ₦15,000 per month or save with the complete 12-week Career Accelerator at ₦40,500.",
  ],
];

const aiFaqs: AiFaq[] = [
  {
    question: "How does the AI manager work?",
    answer:
      "Your AI manager gives you realistic briefs, context, deadlines and feedback the way a workplace lead would. It helps you practise execution, communication and decision-making instead of only watching lessons.",
  },
  {
    question: "Does AI replace human support on WDC Labs?",
    answer:
      "No. AI supports the daily work experience by guiding tasks and reviews, while the programme team remains available for support, policies and account questions.",
  },
  {
    question: "What does the AI review in my assignments?",
    answer:
      "It reviews how clearly you understand the brief, the quality of your output, your reasoning, communication and readiness for workplace expectations.",
  },
  {
    question: "Can AI feedback help me build a stronger portfolio?",
    answer:
      "Yes. Each round of feedback helps you improve the same way work reviews do, so your portfolio shows better thinking, cleaner deliverables and clearer explanations over time.",
  },
];

const supportLink = "https://chat.whatsapp.com/IWMuvfGQhTJHCXBMlfGzir?mode=gi_t";
const privacyLink = "https://wdc.ng/privacy-policy/";
const signupPromoLink = "/signup?promo=FIRSTTASK";

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <Link className="brand" href="#top" aria-label="WDC Labs home">
      <Image
        src={wdcLabsLogo}
        alt="WDC Labs"
        width={150}
        height={48}
        className={footer ? "brand-logo footer-logo" : "brand-logo"}
        priority={!footer}
      />
    </Link>
  );
}

function PartnerLogos() {
  return (
    <div className="partner-logos" aria-label="WDC and accreditation logos">
      <a href="https://wdc.ng/" target="_blank" rel="noopener noreferrer" aria-label="Wild Fusion Digital Centre">
        <Image src={wdcLogo} alt="Wild Fusion Digital Centre" width={96} height={36} />
      </a>
      <a
        href="https://www.actd.us/wildfusiondigitalcentre/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="ACTD accreditation"
      >
        <Image src={actdLogo} alt="ACTD accreditation" width={96} height={36} />
      </a>
    </div>
  );
}

export default function Landing() {
  const [activeTrack, setActiveTrack] = useState<TrackKey>("analytics");
  const [rotatingTrack, setRotatingTrack] = useState<TrackKey>("analytics");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [openAiFaq, setOpenAiFaq] = useState<number | null>(0);
  const selected = tracks[activeTrack];
  const rotatingCourse = tracks[rotatingTrack];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRotatingTrack((currentTrack) => {
        const currentIndex = trackOrder.indexOf(currentTrack);
        return trackOrder[(currentIndex + 1) % trackOrder.length];
      });
    }, 12000);

    return () => window.clearInterval(interval);
  }, []);

  const scrollToStart = () => {
    document.querySelector("#first-task")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="landing-refresh" id="top">
      <header className="site-header">
        <BrandLogo />
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#sample-task">Career tracks</a>
          <a href="#outcomes">Outcomes</a>
          <a href="#pricing">Pricing</a>
          <a href="#ai-qa">AI Q&A</a>
        </nav>
        <div className="header-actions">
          <PartnerLogos />
          <Link className="text-link" href="/login">
            Sign in
          </Link>
          <a className="button button-small" href="#first-task">
            Try your first task <Arrow />
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span>12-week virtual work experience</span>
            <span>Built for ambitious African talent</span>
          </div>
          <h1>
            Build the work experience <em>employers keep asking for.</em>
          </h1>
          <p className="hero-lead">
            Complete realistic workplace assignments, receive actionable performance feedback and create portfolio
            proof you can confidently show employers.
          </p>
          <div className="hero-actions">
            <a className="button button-large" href="#first-task">
              Complete your first task free <Arrow />
            </a>
            <a className="secondary-link" href="#sample-task">
              <span className="play">▶</span> See a sample assignment
            </a>
          </div>
          <div className="hero-notes" aria-label="Trial benefits">
            <span>✓ No payment required</span>
            <span>✓ Choose from 3 career tracks</span>
            <span>✓ Get a performance review</span>
          </div>
        </div>

        <div className="product-stage" aria-label="Preview of the WDC Labs workplace experience">
          <div className="stage-glow" />
          <div className="dashboard-card">
            <div className="dashboard-top">
              <div>
                <span className="mini-mark">W</span>
                <strong>Reality Engine</strong>
              </div>
              <span className="online">● LIVE WORKSPACE</span>
            </div>
            <div className="manager-row">
              <div className="avatar">AM</div>
              <div>
                <small>YOUR AI MANAGER</small>
                <strong>Amara · Strategy Lead</strong>
              </div>
              <span className="status-pill">Task assigned</span>
            </div>
            <div className="task-card">
              <div className="task-meta">
                <span>ASSIGNMENT 01</span>
                <span className="due">Due in 2 days</span>
              </div>
              <h3>Diagnose falling retail revenue</h3>
              <p>Analyze the dataset, identify the key drivers and recommend three actions to leadership.</p>
              <div className="progress">
                <span style={{ width: "38%" }} />
              </div>
              <div className="task-bottom">
                <span>Progress · 38%</span>
                <Link href={signupPromoLink}>
                  Continue task →
                </Link>
              </div>
            </div>
            <div className="feedback-float">
              <span className="score">84</span>
              <div>
                <small>CAREER READINESS</small>
                <strong>Strong analytical thinking</strong>
                <span>+8 points this week</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Programme trust signals">
        <span>
          Built by <strong>Wild Fusion Digital Centre</strong>
        </span>
        <PartnerLogos />
        <span className="trust-divider" />
        <span>
          <strong>ACTD</strong> accredited institution
        </span>
        <span className="trust-divider" />
        <span>
          Payments secured by <strong>Paystack</strong>
        </span>
        <span className="trust-divider" />
        <span>
          <strong>NDPA</strong> data protection
        </span>
      </section>

      <section className="problem-section section-pad">
        <div className="problem-copy">
          <span className="section-label">THE HIRING GAP</span>
          <h2>
            You don&apos;t need another course.
            <br />
            <em>You need proof you can do the work.</em>
          </h2>
          <p>
            Employers do not hire certificates. They hire people who can solve problems, explain their decisions and
            deliver useful work.
          </p>
        </div>
        <div className="comparison">
          <div className="compare-card muted-card">
            <small>THE TYPICAL COURSE</small>
            <h3>Watch. Quiz. Forget.</h3>
            <ul>
              <li>Passive video lessons</li>
              <li>Generic certificates</li>
              <li>No realistic deadlines</li>
              <li>Little useful feedback</li>
            </ul>
          </div>
          <div className="versus">VS</div>
          <div className="compare-card active-card">
            <small>THE WDC LABS EXPERIENCE</small>
            <h3>Do. Improve. Prove.</h3>
            <ul>
              <li>Real workplace assignments</li>
              <li>Verified portfolio projects</li>
              <li>Performance feedback</li>
              <li>Interview-ready stories</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="process section-pad" id="how-it-works">
        <div className="section-intro centered">
          <span className="section-label">YOUR FIRST WEEK</span>
          <h2>
            From curious to capable, <em>one task at a time.</em>
          </h2>
          <p>Your experience starts with doing, not watching.</p>
        </div>
        <div className="steps">
          {[
            ["01", "Choose your track", "Select the career path that matches where you want to grow."],
            ["02", "Meet your AI manager", "Receive a clear role, company context and realistic expectations."],
            ["03", "Complete a real task", "Work through a practical brief with examples and support when needed."],
            ["04", "Receive feedback", "See your strengths, gaps and specific recommendations for improvement."],
            ["05", "Build your proof", "Turn your strongest work into a verified portfolio employers can inspect."],
          ].map(([n, title, copy]) => (
            <article className="step" key={n}>
              <span>{n}</span>
              <div className="step-icon">{n === "01" ? "◎" : n === "02" ? "◌" : n === "03" ? "⌁" : n === "04" ? "↗" : "◇"}</div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sample section-pad" id="sample-task">
        <div className="sample-top">
          <div>
            <span className="section-label light-label">EXPERIENCE THE PRODUCT</span>
            <h2>
              See the kind of work
              <br />
              <em>you&apos;ll actually do.</em>
            </h2>
          </div>
          <p>
            No toy exercises. Every task is designed around the decisions, deliverables and standards you will meet in a
            real role.
          </p>
        </div>
        <div className="track-tabs" role="tablist" aria-label="Career track samples">
          {(Object.keys(tracks) as TrackKey[]).map((key) => (
            <button key={key} role="tab" type="button" aria-selected={activeTrack === key} onClick={() => setActiveTrack(key)}>
              {tracks[key].label}
            </button>
          ))}
        </div>
        <div className="assignment-window">
          <aside>
            <small>YOU ARE THE</small>
            <h3>{selected.role}</h3>
            <div className="company-card">
              <span>CLIENT</span>
              <strong>Northstar Retail</strong>
              <small>Consumer commerce · Lagos</small>
            </div>
            <div className="brief-stat">
              <span>DIFFICULTY</span>
              <strong>●●○</strong>
            </div>
            <div className="brief-stat">
              <span>EST. TIME</span>
              <strong>3-4 hours</strong>
            </div>
            <div className="brief-stat">
              <span>TOOLS</span>
              <strong>{selected.tool}</strong>
            </div>
          </aside>
          <div className="assignment-main">
            <span className="assignment-number">ASSIGNMENT 01 · BUSINESS DIAGNOSIS</span>
            <h3>{selected.task}</h3>
            <p>
              Your manager expects a concise analysis that connects evidence to action. You will be assessed on
              research, execution, communication and commercial judgment.
            </p>
            <h4>WHAT YOU WILL SUBMIT</h4>
            <div className="deliverables">
              {selected.deliverables.map((item, i) => (
                <div key={item}>
                  <span>0{i + 1}</span>
                  {item}
                </div>
              ))}
            </div>
            <button className="ghost-button" type="button" onClick={scrollToStart}>
              Try this assignment free <Arrow />
            </button>
          </div>
          <div className="review-preview">
            <div className="review-head">
              <small>YOUR PERFORMANCE REVIEW</small>
              <span>84/100</span>
            </div>
            <div className="bars">
              <label>
                Research <span>88</span>
              </label>
              <i>
                <b style={{ width: "88%" }} />
              </i>
              <label>
                Execution <span>82</span>
              </label>
              <i>
                <b style={{ width: "82%" }} />
              </i>
              <label>
                Communication <span>76</span>
              </label>
              <i>
                <b style={{ width: "76%" }} />
              </i>
            </div>
            <div className="manager-note">
              <span>AM</span>
              <p>
                <strong>Manager note</strong>
                “Your evidence is strong. Make the recommendation more decisive by ranking actions by expected impact.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="proof section-pad">
        <div className="section-intro">
          <span className="section-label">REAL WORK. VISIBLE GROWTH.</span>
          <h2>
            Build evidence that makes
            <br />
            <em>interviews easier.</em>
          </h2>
        </div>
        <div className="proof-grid">
          <article className="quote-card">
            <div className="quote-mark">“</div>
            <blockquote>
              Before WDC Labs, I could describe what I learned. Now I can show how I approached a problem, what I
              delivered and what I improved.
            </blockquote>
            <div className="person">
              <span>TA</span>
              <p>
                <strong>Tomi A.</strong>Data Analytics participant
              </p>
            </div>
          </article>
          <article className="portfolio-card">
            <div className="portfolio-cover">
              <span>VERIFIED PROJECT</span>
              <strong>
                Retail Revenue
                <br />
                Diagnostic
              </strong>
              <small>Analysis · Dashboard · Recommendations</small>
            </div>
            <div className="portfolio-footer">
              <span>Data Analytics</span>
              <strong>View work ↗</strong>
            </div>
          </article>
          <article className="metric-card">
            <span className="big-number">6-8</span>
            <strong>portfolio-ready projects</strong>
            <p>Complete work you can explain, defend and improve, not just list on a CV.</p>
            <div className="mini-metrics">
              <span>
                <b>12</b> tasks
              </span>
              <span>
                <b>12</b> weeks
              </span>
            </div>
          </article>
        </div>
      </section>

      <section className="outcomes section-pad" id="outcomes">
        <div className="outcomes-copy">
          <span className="section-label light-label">YOUR 12-WEEK OUTCOME</span>
          <h2>
            Leave with more than
            <br />
            <em>a certificate.</em>
          </h2>
          <p>Every part of the programme is designed to help you prove how you think, work and improve.</p>
          <a href="#first-task" className="outline-light">
            Start building your proof <Arrow />
          </a>
        </div>
        <div className="outcome-list">
          {[
            ["01", "Verified digital portfolio", "A shareable collection of selected assignments and project outputs."],
            ["02", "Performance history", "Evidence of your scores, feedback and progress across the programme."],
            ["03", "Career Readiness Score", "A clear view of your strengths and the skills you still need to sharpen."],
            ["04", "CV and interview stories", "Specific examples that make your contribution easier to explain."],
            ["05", "Recommendation eligibility", "Top performers may qualify for detailed institutional references.*"],
          ].map(([n, title, copy]) => (
            <article key={n}>
              <span>{n}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
              <b>↗</b>
            </article>
          ))}
          <small>*Eligibility requirements and programme policies apply.</small>
        </div>
      </section>

      <section className="pricing section-pad" id="pricing">
        <div className="section-intro centered">
          <span className="section-label">SIMPLE, FLEXIBLE PRICING</span>
          <h2>
            Experience the value first.
            <br />
            <em>Pay only when you&apos;re ready.</em>
          </h2>
          <p>Complete your first assignment and review free. Upgrade to continue your 12-week experience.</p>
        </div>
        <div className="pricing-grid">
          <article className="plan-card">
            <span className="plan-kicker">MONTHLY FLEX</span>
            <h3>Move at your pace.</h3>
            <div className="price">
              <b>₦15,000</b>
              <span>/ month</span>
            </div>
            <p>Pay monthly while you progress through the workplace experience.</p>
            <ul>
              <li>Full track and assignment access</li>
              <li>AI manager feedback</li>
              <li>Verified portfolio development</li>
              <li>Monthly performance summary</li>
            </ul>
            <Link className="plan-button" href={signupPromoLink}>
              Start with a free task <Arrow />
            </Link>
          </article>
          <article className="plan-card featured-plan">
            <span className="best-value">BEST VALUE · SAVE 10%</span>
            <span className="plan-kicker">12-WEEK CAREER ACCELERATOR</span>
            <h3>Complete the full transformation.</h3>
            <div className="price">
              <b>₦40,500</b>
              <span>/ 3 months</span>
            </div>
            <p>A structured experience with everything you need to build credible work proof.</p>
            <ul>
              <li>Everything in Monthly Flex</li>
              <li>Complete 12-week progression</li>
              <li>Final performance report</li>
              <li>Career Readiness Score</li>
              <li>Recommendation eligibility</li>
            </ul>
            <Link className="plan-button bright" href={signupPromoLink}>
              Try your first task free <Arrow />
            </Link>
            <small>One payment. No recurring billing.</small>
          </article>
        </div>
      </section>

      <section className="ai-qa-section section-pad" id="ai-qa">
        <div className="ai-qa-intro">
          {/* <span className="section-label">AI-OPTIMIZED Q&A</span> */}
          <h2>
            How AI helps you
            <br />
            <em>practise real work.</em>
          </h2>
          <p>
            Focused answers about the AI manager, feedback and how WDC Labs uses AI inside the work experience.
          </p>
        </div>
        <div className="ai-qa-list" itemScope itemType="https://schema.org/FAQPage">
          {aiFaqs.map((faq, index) => (
            <article
              className="ai-qa-item"
              key={faq.question}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <button
                type="button"
                aria-expanded={openAiFaq === index}
                onClick={() => setOpenAiFaq(openAiFaq === index ? null : index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong itemProp="name">{faq.question}</strong>
                <b>{openAiFaq === index ? "−" : "+"}</b>
              </button>
              {openAiFaq === index && (
                <p itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <span itemProp="text">{faq.answer}</span>
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="faq section-pad">
        <div className="faq-intro">
          <span className="section-label">CLEAR ANSWERS</span>
          <h2>
            Before you
            <br />
            <em>get to work.</em>
          </h2>
          <p>
            Still unsure? Message our programme support team on WhatsApp and we&apos;ll help you choose the right track.
          </p>
          <a href={supportLink} target="_blank" rel="noopener noreferrer" className="whatsapp-link">
            Chat with programme support ↗
          </a>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a], i) => (
            <div className="faq-item" key={q}>
              <button type="button" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {q}
                <b>{openFaq === i ? "−" : "+"}</b>
              </button>
              {openFaq === i && <p>{a}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="activation" id="first-task">
        <div className="activation-copy">
          <span className="section-label light-label">YOUR FIRST ASSIGNMENT IS FREE</span>
          <h2>
            Ready to stop watching
            <br />
            and <em>start doing?</em>
          </h2>
          <p>Create your account and start with a free workplace assignment before deciding whether to continue.</p>
          <div className="activation-badges">
            <span>✓ No card required</span>
            <span>✓ Takes 2 minutes</span>
            <span>✓ Feedback included</span>
          </div>
        </div>
        <div className="start-form start-panel">
          <span className="start-kicker">STARTING WITH</span>
          <strong className="rotating-course" key={rotatingTrack}>
            {rotatingCourse.label}
          </strong>
          <div className="course-rail" aria-label="Available career tracks">
            {trackOrder.map((trackKey) => (
              <span key={trackKey} className={trackKey === rotatingTrack ? "is-active" : ""}>
                {tracks[trackKey].label}
              </span>
            ))}
          </div>
          <p>You can choose or change your track on the signup page before creating your account.</p>
          <Link href={signupPromoLink} className="start-cta">
            Start free assignment <Arrow />
          </Link>
          <small>
            No card details required. By continuing, you agree to our{" "}
            <a href={privacyLink} target="_blank" rel="noopener noreferrer">
              Terms and Privacy Policy
            </a>
            .
          </small>
        </div>
      </section>

      <footer>
        <div className="footer-top">
          <BrandLogo footer />
          <p>
            A product of Wild Fusion Digital Centre. Building job-ready African tech talent through practical work
            experience.
          </p>
          <div className="footer-links">
            <div>
              <strong>Programme</strong>
              <a href="#how-it-works">How it works</a>
              <a href="#sample-task">Career tracks</a>
              <a href="#pricing">Pricing</a>
              <a href="#ai-qa">AI Q&A</a>
            </div>
            <div>
              <strong>Support</strong>
              <a href="mailto:labs@wdc.com.ng">Contact us</a>
              <a href={privacyLink} target="_blank" rel="noopener noreferrer">
                Terms of use
              </a>
              <a href={privacyLink} target="_blank" rel="noopener noreferrer">
                Privacy policy
              </a>
            </div>
          </div>
          <PartnerLogos />
        </div>
        <div className="footer-bottom">
          <span>© 2026 Wild Fusion Digital Centre</span>
          <span>Lagos, Nigeria · labs@wdc.com.ng</span>
        </div>
      </footer>
    </main>
  );
}
