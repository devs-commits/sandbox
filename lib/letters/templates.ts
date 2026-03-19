export function generate12WeekLetter(name: string, track: string) {

return `
<div style="font-family: Arial; max-width:800px">

<p><strong>From the Desk of:</strong></p>

<p>
Abasiama Idaresit<br/>
Chief Executive Officer<br/>
Wild Fusion Digital Centre (WDC)<br/>
trainings@wdc.com.ng
</p>

<p>${new Date().toLocaleDateString()}</p>

<h2>
LETTER 2: 12-WEEK INTERNSHIP
<br/>
<span style="font-size:14px">
(Entry-Level / Academic Program Focus)
</span>
</h2>

<p><strong>To Whom It May Concern,</strong></p>

<p>
I am writing to formally recommend <strong>${name}</strong>,
who successfully completed a 12-week structured internship
within the <strong>${track}</strong> track at
Wild Fusion Digital Centre (WDC).
</p>

<p>
Throughout the program, ${name.split(" ")[0]} demonstrated strong intellectual curiosity,
professional conduct, and the ability to apply practical knowledge
to real-world projects.
</p>

<p>
Based on their performance, I confidently recommend them
for entry-level professional roles or further academic advancement.
</p>

<p>Signed,</p>

<p>
<strong>Abasiama Idaresit</strong><br/>
CEO, Wild Fusion Digital Centre (WDC)
</p>

</div>
`;
}