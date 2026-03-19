import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {

    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "12week";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    /* FETCH USER */

    const { data: user, error } = await supabase
      .from("users")
      .select("full_name, track")
      .eq("auth_id", userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const fullName = user.full_name;
    const firstName = fullName.split(" ")[0];

    const rawTrack = user.track || "Digital Marketing";

    const track = rawTrack
      .split("-")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const pronoun = "they";
    const possessive = "their";

    /* CREATE PDF */

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();

    let y = height - 70;
    const margin = 60;
    const maxWidth = width - margin * 2;

    /* BASIC WRITER */

    const write = (text: string, size = 12, isBold = false) => {

      const activeFont = isBold ? bold : font;

      const words = text.split(" ");
      let line = "";

      for (const word of words) {

        const test = line + word + " ";
        const w = activeFont.widthOfTextAtSize(test, size);

        if (w > maxWidth) {

          page.drawText(line.trim(), {
            x: margin,
            y,
            size,
            font: activeFont
          });

          y -= size + 6;
          line = word + " ";

        } else {

          line = test;

        }

      }

      if (line.trim()) {

        page.drawText(line.trim(), {
          x: margin,
          y,
          size,
          font: activeFont
        });

        y -= size + 6;

      }

    };

    /* JUSTIFIED PARAGRAPH */

    const justifyParagraph = (text: string, size = 12) => {

      const words = text.split(" ");

      let lineWords: string[] = [];
      let line = "";

      for (const word of words) {

        const testLine = line + word + " ";
        const widthCheck = font.widthOfTextAtSize(testLine, size);

        if (widthCheck > maxWidth && lineWords.length > 0) {

          const textWidth = font.widthOfTextAtSize(lineWords.join(" "), size);
          const gaps = lineWords.length - 1;

          let extraSpace = 0;

          if (gaps > 0) {
            extraSpace = (maxWidth - textWidth) / gaps;
          }

          let x = margin;

          lineWords.forEach((w, i) => {

            page.drawText(w, {
              x,
              y,
              size,
              font
            });

            const wordWidth = font.widthOfTextAtSize(w, size);
            x += wordWidth;

            if (i < gaps) {
              x += font.widthOfTextAtSize(" ", size) + extraSpace;
            }

          });

          y -= size + 6;

          lineWords = [word];
          line = word + " ";

        } else {

          lineWords.push(word);
          line = testLine;

        }

      }

      /* last line not justified */

      page.drawText(lineWords.join(" "), {
        x: margin,
        y,
        size,
        font
      });

      y -= size + 12;

    };

    /* HEADER */

    write("From the Desk of:", 12, true);
    y -= 4;

    write("Abasiama Idaresit");
    write("Chief Executive Officer");
    write("Wild Fusion Digital Centre (WDC)");

    page.drawText("trainings@wdc.com.ng", {
      x: margin,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 1)
    });

    y -= 40;

    write(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    );

    y -= 20;

    /* TITLE */

    const title =
      type === "24week"
        ? "24-WEEK INTERNSHIP (Post-Graduate / Job Reference Focus)"
        : "12-WEEK INTERNSHIP (Entry-Level / Academic Program Focus)";

    write(title, 12, true);

    y -= 15;

    /* SALUTATION */

    write("To Whom It May Concern,", 12, true);

    y -= 18;

    /* BODY */

    if (type === "24week") {

      justifyParagraph(
        `It is my distinct pleasure to write this letter of recommendation on behalf of ${fullName}. As the Chief Executive Officer of Wild Fusion Digital Centre (WDC), a fully accredited training and capacity-building institution dedicated to developing the next generation of digital professionals, I oversee our intensive WDC Labs programs. ${firstName} successfully completed a rigorous 24-week structured internship within our ${track} track.`
      );

      justifyParagraph(
        `During the program, ${firstName} demonstrated strong professional growth, technical competence, and an impressive ability to apply analytical thinking to practical assignments. Over time, ${pronoun} developed increasing confidence and independence while delivering high-quality work within a demanding professional environment.`
      );

      justifyParagraph(
        `Throughout the internship, ${firstName} contributed meaningfully to research tasks, project collaboration, and analytical assignments aligned with the ${track} discipline. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} consistently showed attention to detail, reliability, and the ability to meet expectations even under tight deadlines.`
      );

      justifyParagraph(
        `Beyond technical performance, ${firstName} displayed strong professional character. ${possessive.charAt(0).toUpperCase() + possessive.slice(1)} communication skills, accountability, and collaborative approach made ${firstName} a valuable member of our training cohort.`
      );

      justifyParagraph(
        `Based on ${possessive} sustained performance and professional discipline, I confidently recommend ${fullName} for professional opportunities, graduate-level programs, or advanced training aligned with the ${track} field. ${firstName} possesses the work ethic and intellectual capability required to succeed in demanding professional environments.`
      );

    } else {

      justifyParagraph(
        `I am pleased to formally recommend ${fullName}, who successfully completed a 12-week internship with Wild Fusion Digital Centre (WDC) within the ${track} specialization. This program is designed to introduce emerging professionals to industry-grade workflows and practical project execution.`
      );

      justifyParagraph(
        `${firstName} demonstrated strong intellectual curiosity, professionalism, and a willingness to learn quickly. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} consistently applied feedback constructively and showed the ability to understand complex tasks within the ${track} domain.`
      );

      justifyParagraph(
        `Throughout the internship, ${firstName} supported project activities, analytical assignments, and collaborative team tasks. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} maintained excellent communication habits and professional conduct during the program.`
      );

      justifyParagraph(
        `Based on ${possessive} performance and positive attitude toward learning, I confidently recommend ${fullName} for entry-level professional roles, further specialized training, or continued academic development. ${firstName} has demonstrated the potential to grow into a strong professional contributor.`
      );

    }

    /* SIGNATURE */

    y -= 10;

    write("Signed,");

    y -= 10;

    write("Abasiama Idaresit", 12, true);
    write("CEO, Wild Fusion Digital Centre (WDC)");

    /* SAVE PDF */

    const pdfBytes = await pdfDoc.save();

    const fileName =
      `${fullName}-${track}-${type === "24week" ? "Work-Letter-of-Reference" : "Visa-Letter-of-Reference"}.pdf`
      .replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    });

  } catch (err) {

    console.error("PDF GENERATION ERROR:", err);

    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );

  }
}