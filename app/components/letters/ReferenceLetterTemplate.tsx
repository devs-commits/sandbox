"use client";
import { forwardRef, useEffect, useState } from "react";
import QRCode from "qrcode";
import wdcLogo from "../../../public/wdc_labs_logo.png";
import signature from "../../../public/signature.png";
import actdLogo from "../../../public/actd-logos.png";
import wdcBadge from "../../../public/wdc-logo copy.jpg";
import Image from "next/image";

export type LetterType = "12week" | "24week";

export interface LetterData {
  fullName: string;
  track?: string;
  type: LetterType;
  candidateId?: string;
  jobTitle?: string;
  projects?: { title: string; description: string }[];
}

interface Props {
  data: LetterData;
}

/**
 * Print-ready A4 letter template (794 x 1123 px @ 96dpi).
 * Rendered off-screen, captured to canvas, exported as PDF.
 */
export const ReferenceLetterTemplate = forwardRef<HTMLDivElement, Props>(
  ({ data }, ref) => {
    const [qrUrl, setQrUrl] = useState<string>("");

    const today = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const year = new Date().getFullYear();
    const candidateId =
      data.candidateId ||
      `WDC-${year}-${data.fullName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;

    const track = data.track || "Digital Marketing";
    const formattedTrack = track
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const jobTitle = data.jobTitle || `${formattedTrack} Associate (WDC Labs Intern)`;
    const firstName = data.fullName.split(" ")[0];
    const isWork = data.type === "12week";
    const isVisa = data.type === "24week";
    const durationLabel = isWork ? "12-week" : "24-week";

    const accent = isVisa
      ? { from: "#0f766e", to: "#0d9488", solid: "#0f766e", soft: "#ecfdf5", softText: "#0f766e" }
      : { from: "#4f46e5", to: "#7c3aed", solid: "#4f46e5", soft: "#eef2ff", softText: "#4338ca" };

    const subjectLine = isVisa
      ? `Endorsement of Exceptional Talent / Promise in Digital Technology for ${data.fullName}`
      : `Official Letter of Recommendation & Verification of Practical Experience for ${data.fullName}`;

    const visaProjects = {
      "cyber-security": [
        {
          title: "Threat Hunting & SIEM Mastery",
          description: "Successfully identified, isolated, and mitigated a simulated zero-day ransomware attack within a live network environment, meeting a strict 4-hour SLA requirement.",
        },
        {
          title: "Automated Security Pipeline Engineering",
          description: "Engineered an automated threat detection pipeline that reduced incident response time by 40%, demonstrating strong capability in security automation and systems design.",
        },
      ],
      "data-analytics": [
        {
          title: "Advanced Data Pipeline Optimization",
          description: "Designed and implemented an automated ETL pipeline that processed 10M+ records, reducing processing time by 45% while maintaining 99.8% data integrity.",
        },
        {
          title: "Predictive Analytics Model Development",
          description: "Built a machine learning model that achieved 92% accuracy in customer churn prediction, delivering actionable insights that increased retention by 25%.",
        },
      ],
      "digital-marketing": [
        {
          title: "Multi-Channel Campaign Optimization",
          description: "Led a comprehensive digital campaign across 6 platforms, achieving 3.2x ROI and 45% increase in qualified leads through advanced audience segmentation.",
        },
        {
          title: "Marketing Automation System Design",
          description: "Engineered an automated lead nurturing system that increased conversion rates by 60% and reduced manual effort by 70% through behavioral targeting.",
        },
      ],
    };

    const projects =
      data.projects ||
      (isVisa
        ? visaProjects[track as keyof typeof visaProjects] || visaProjects["digital-marketing"]
        : [
            {
              title: `${track} Foundations Project`,
              description: `Completed structured assignments applying core ${formattedTrack.toLowerCase()} principles to industry-style briefs with consistent quality and attention to detail.`,
            },
            {
              title: "Team Collaboration Sprint",
              description: `Supported a cross-functional sprint, contributing research, analysis, and documentation that strengthened the final team output.`,
            },
          ]);

    const verifyUrl = `https://wdc.com.ng/verify/${candidateId}`;

    useEffect(() => {
      QRCode.toDataURL(verifyUrl, { margin: 1, width: 160 }).then(setQrUrl);
    }, [verifyUrl]);

    return (
      <div
        ref={ref}
        style={{
          width: "794px",
          height: "1123px",
          overflow: "hidden",
          fontFamily: "'Inter', sans-serif",
          background: "#ffffff",
          color: "#0f172a",
        }}
        className="relative"
      >
        {/* Top accent bar */}
        <div
          style={{
            background: `linear-gradient(90deg, ${accent.from} 0%, ${accent.to} 100%)`,
            height: "10px",
          }}
        />

        <div style={{ padding: "40px 56px 56px 56px" }}>
          {/* Logo Bar */}
          <div
            style={{
              background: "hsla(207,36%,95%,1)",
              padding: "12px 20px",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <Image
              src={wdcLogo}
              alt="WDC Labs"
              style={{
                height: "35px",
                width: "auto",
                display: "block",
              }}
              priority
              quality={100}
              unoptimized
            />
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Image
                src={wdcBadge}
                alt="WDC"
                style={{
                  height: "35px",
                  width: "auto",
                  display: "block",
                }}
                quality={100}
                unoptimized
              />
              <Image
                src={actdLogo}
                alt="ACTD Accredited"
                style={{
                  height: "35px",
                  width: "auto",
                  display: "block",
                }}
                quality={100}
                unoptimized
              />
            </div>
          </div>

          {/* Header Info */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "20px",
            }}
          >
            <div>
              {/* Verification hotline */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "12px",
                  color: "#475569",
                }}
              >
                <span style={{ color: accent.solid, fontWeight: 700 }}>
                  ✓ Verification Hotline:
                </span>
                <span>+234 813 080 7750</span>
                <span style={{ color: "#cbd5e1" }}>|</span>
                <span>labs@wdc.com.ng</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{ fontSize: "12px", color: "#64748b", marginTop: "10px" }}
              >
                Ref: <strong style={{ color: "#0f172a" }}>{candidateId}</strong>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>{today}</div>
            </div>
          </div>

          {/* Subject */}
          <div style={{ marginTop: "4px" }}>
            {/* <div
              style={{
                fontSize: "10px",
                letterSpacing: "1.5px",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              SUBJECT
            </div> */}
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#0f172a",
                marginTop: "4px",
                lineHeight: 1.4,
              }}
            >
              {subjectLine}
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              marginTop: "24px",
              fontSize: "13px",
              lineHeight: 1.7,
              color: "#1e293b",
              textAlign: "justify",
            }}
          >
            <p style={{ fontWeight: 600 }}>To Whom It May Concern,</p>
            {isVisa ? (
              <>
                <p style={{ marginTop: "12px" }}>
                  I am writing to formally endorse <strong>{data.fullName}</strong> as an individual of exceptional promise and demonstrated technical capability within the global digital technology sector.
                </p>
                <p style={{ marginTop: "12px" }}>
                  As the Chief Executive Officer of Wild Fusion Digital Centre (WDC Labs), one of Africa's leading digital technology institutes accredited by the American Council of Training and Development (ACTD), I have overseen the training, assessment, and professional development of thousands of technology professionals across multiple disciplines. Based on this experience, I can state with confidence that {firstName} represents the upper tier of emerging global technology talent.
                </p>
                <p style={{ marginTop: "12px" }}>
                  <strong>{firstName}</strong> successfully completed our highly selective WDC Labs Tech Accelerator, an advanced, simulation-driven program designed to replicate real-world corporate and enterprise-level technical environments.
                </p>
                <p style={{ marginTop: "12px" }}>
                  Unlike traditional academic models, candidates are evaluated based on technical execution, operational agility, problem-solving under pressure, and innovation in real-time scenarios.
                </p>
                <p style={{ marginTop: "12px" }}>
                  During the program, <strong>{firstName}</strong> operated in the capacity of a <strong>{jobTitle}</strong>, demonstrating strong proficiency in advanced {formattedTrack} principles and enterprise-level applications.
                </p>
              </>
            ) : (
              <>
                <p style={{ marginTop: "12px" }}>
                  It is with great pleasure that I provide this Global Recommendation for <strong>{data.fullName}</strong>, who has successfully completed a {durationLabel} practical engagement at Wild Fusion Digital Centre as a <strong>{jobTitle}</strong>.
                </p>
                <p style={{ marginTop: "12px" }}>
                  WDC Labs operates as a high-pressure, output-driven environment where we simulate real-world digital transformation challenges. Our candidates do not just &ldquo;learn&rdquo;—they execute. During their tenure, {firstName} was embedded within our core teams, contributing to high-stakes projects that required both technical precision and strategic thinking.
                </p>
                <p style={{ marginTop: "12px" }}>
                  We have rigorously verified {firstName}&rsquo;s performance across the following core competencies and practical projects:
                </p>
              </>
            )}

            {/* Projects */}
            <div style={{ marginTop: "14px" }}>
              {projects.map((p: { title: string; description: string }, i: number) => (
                <div
                  key={i}
                  style={{
                    borderLeft: `3px solid ${accent.solid}`,
                    paddingLeft: "14px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    {p.title}
                  </div>
                  <div
                    style={{
                      fontSize: "12.5px",
                      color: "#475569",
                      marginTop: "2px",
                    }}
                  >
                    {p.description}
                  </div>
                </div>
              ))}
            </div>

            {isVisa ? (
              <>
                <p style={{ marginTop: "10px" }}>
                  The competencies demonstrated by <strong>{firstName}</strong> are highly specialized, globally transferable, and in strong demand across modern digital economies. Their ability to independently execute complex technical mandates positions them as an immediate contributor to any advanced technology ecosystem.
                </p>
                <p style={{ marginTop: "12px" }}>
                  I endorse <strong>{firstName}</strong> without reservation. They possess a rare combination of technical rigor, innovative thinking, and professional resilience. These qualities are essential for driving meaningful impact within your country's technology sector.
                </p>
                {/* <p style={{ marginTop: "12px" }}>
                  This endorsement, along with the candidate's portfolio and performance records, can be independently verified through our official channels using the reference number provided above.
                </p> */}
              </>
            ) : (
              <>
                <p style={{ marginTop: "12px" }}>
                  I endorse {firstName} without reservation. They possess a rare combination of technical rigor, innovative thinking, and professional resilience. These qualities are essential for driving meaningful impact within the fast-paced global digital economy. They consistently met stringent deadlines and maintained the high quality of deliverables expected by our digital performance standards.
                </p>
                <p style={{ marginTop: "12px" }}>
                  We endorse {firstName}&rsquo;s professional capabilities without reservation and believe they will be a significant asset to any forward-thinking organization. This letter serves as both a recommendation and a formal verification of their practical experience.
                </p>
              </>
            )}
          </div>

          {/* Signature + QR */}
          <div
            style={{
              marginTop: "32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div>
              <Image
                src={signature}
                alt="Abasiama Idaresit Signature"
                style={{
                  height: "40px",
                  width: "auto",
                  display: "block",
                }}
                quality={100}
                unoptimized
              />
              <div
                style={{
                  marginTop: "6px",
                  borderTop: "1px solid #cbd5e1",
                  paddingTop: "6px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Abasiama Idaresit
              </div>
              <div style={{ fontSize: "12px", color: "#475569" }}>
                CEO, Wild Fusion Digital Centre
              </div>
              <div style={{ fontSize: "12px", color: accent.solid }}>
                labs@wdc.com.ng
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              {qrUrl && (
                <img
                  src={qrUrl}
                  alt="Verify"
                  style={{ width: "90px", height: "90px" }}
                />
              )}
              <div
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  marginTop: "4px",
                  letterSpacing: "1px",
                }}
              >
                SCAN TO VERIFY
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: "28px",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "12px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "#64748b",
            }}
          >
            <span>🔒 Secure Document · Tamper-evident</span>
            <span>WDC Labs · {year} · Print Enabled</span>
          </div>
        </div>
      </div>
    );
  },
);

ReferenceLetterTemplate.displayName = "ReferenceLetterTemplate";