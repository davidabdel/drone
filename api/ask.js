// Vercel serverless function — CASA-grounded Q&A assistant.
//
// Strict-source design: the model is given ONLY the CASA_CORPUS text below
// (fetched directly from casa.gov.au, sourced and dated per entry) and is
// instructed to answer solely from it, citing the source page, and to say
// so plainly when a question isn't covered rather than fall back on general
// knowledge. This makes answers auditable, but it is not an absolute
// technical guarantee that a model will never blend in outside knowledge —
// that is a known limitation of LLMs, not something a prompt can fully
// eliminate. Treat answers as a starting point, not a formal CASA ruling.
//
// Requires OPENAI_API_KEY in Vercel env vars (never exposed to the client).
// Refresh CASA_CORPUS periodically — it is a snapshot, not a live feed.

const CASA_CORPUS = [
  {
    title: "Drone weight categories and requirements",
    url: "https://www.casa.gov.au/drones/operator-accreditation-certificate/drone-weight-categories-and-requirements",
    lastUpdated: "11 Oct 2024",
    text: `Drone weight classifications: micro = 250g or less; very small = more than 250g but not more than 2kg; small = more than 2kg but not more than 25kg; medium = more than 25kg but not more than 150kg.

Micro RPA (250g or less): can be flown for business/work without a RePL or ReOC. Must: get an ARN (organisation ARN for a business), get an RPA operator accreditation, register the drone, fly within the drone safety rules.

Very small, excluded category RPA (2kg or less — "sub-2kg excluded category"): can be flown for business/work without a RePL or ReOC. Examples: photographers, real estate agents, researchers, construction/trades, government/community services. Must: get an ARN, get an RPA operator accreditation, register the drone, fly only within the standard operating conditions.

Small, excluded category RPA (more than 2kg but not more than 25kg): can be flown over your OWN land for business/work without a RePL or ReOC, provided you do not accept any payment for the services ("landowner/private landholder excluded category"). Must: get an ARN, get an RPA operator accreditation, register the drone, fly within standard operating conditions, keep required operational records, not accept payment.

Medium, excluded category RPA (more than 25kg but not more than 150kg): can be flown over your own land for business/work without a ReOC (same no-payment condition), but you MUST get a RePL for the type/model of drone.

If you fly without the appropriate accreditation, or fly an unregistered RPA, penalties apply.`
  },
  {
    title: "Get or renew your operator accreditation",
    url: "https://www.casa.gov.au/drones/operator-accreditation-certificate/get-or-renew-your-operator-accreditation",
    lastUpdated: "11 Oct 2024",
    text: `You must get an RPA operator accreditation to fly for business/work if your drone weighs: 250g or less (micro), more than 250g but no more than 2kg (very small), or more than 2kg but no more than 25kg AND you only fly over your own land (small).

You do NOT need an operator accreditation if: you hold a RePL, you hold a ReOC, or you are flying for fun/recreation (including at CASA-approved model airfields). You must also register your drone before flying regardless.

Accreditation is free, done online via myCASA (Digital Identity + ARN + a quiz requiring 85%+ to pass), and is valid for 3 years, renewable up to 30 days before expiry. Accreditations expire automatically. You must be 16+ (or supervised by an accredited adult if under 16). Must follow the drone safety rules and the standard operating conditions for micro/excluded category RPA — see the "Plain English guide for Micro and Excluded RPA operations".`
  },
  {
    title: "Registration requirements",
    url: "https://www.casa.gov.au/drones/drone-registration/registration-requirements",
    lastUpdated: "8 Jul 2026",
    text: `You must register any drone used for business/work purposes no matter how much it weighs (photography, inspections, monitoring/surveillance/security, R&D, or any non-recreational activity). You do NOT need to register if you don't intend to fly it, you fly only for sport/recreation, or you're a commercial drone repairer/manufacturer (still must keep records).

Registration is done online in a few minutes, valid for 12 months. Must be 16+. If used for business/work you must ALSO get an operator accreditation and a RePL (where applicable per weight category).

Registration levy: drones 500g or less register for free; drones over 500g incur a $40 registration levy per drone. Refunds may be available in exceptional cases.

Penalty for flying an unregistered drone for business/work: fine up to $18,200. You may need to show your certificate of registration to CASA, AFP, or state/territory police on request.`
  },
  {
    title: "Register your drone",
    url: "https://www.casa.gov.au/drones/drone-registration/register-your-drone",
    lastUpdated: "11 Oct 2024",
    text: `To register a drone you must be 16+, have a Digital Identity/proof of identity, a myCASA account, an ARN (organisation ARN recommended for a business/fleet so others can manage it), and know the drone's make, model, serial number, weight and type. Steps: log into myCASA with Digital Identity, apply for/link an ARN, enter personal details, submit ID (passport, birth certificate, citizenship certificate, ImmiCard, or foreign passport), select drone manufacturer/model (or "other/home built" with manual details), enter the drone's serial number (often inside the battery compartment, on the warranty card, packaging, or via the drone's app), note if it's registered overseas, review the summary/declaration, then pay. Add multiple drones by repeating via "Add Drone".`
  },
  {
    title: "Get your remote pilot licence (RePL)",
    url: "https://www.casa.gov.au/drones/remote-pilot-licence/get-your-remote-pilot-licence",
    lastUpdated: "11 Oct 2024",
    text: `You only need a RePL if you want to: be a remote pilot for a business that holds a ReOC, or fly a drone more than 25kg but less than 150kg over your own land for business/work. You do NOT need a RePL if you're flying a micro RPA (250g or less) or an excluded-category RPA (more than 250g but no more than 2kg; or more than 2kg but less than 25kg over your own land), or flying for fun.

A RePL shows the type/weight category you're rated for (less than 7kg, less than 25kg, less than 150kg, or more than 150kg — the latter two are type-specific ratings). A RePL does not expire and there is no minimum age.

Medium RPA (25–150kg) flown over your own land without payment: needs a RePL for the type/model but does NOT need a ReOC; must fly within standard operating conditions, not accept payment, and keep operational records.

To get a RePL: get an ARN, find a certified RePL training provider, pass the theory component, pass the practical skills component for your RPA type/category; the training provider then applies to CASA on your behalf. Recognition of prior aviation experience (e.g. PPL/CPL/ATPL theory, military/ATC quals) can exempt you from the common theory component, though RPA-specific theory/practical may still be required, plus 5 logged flying hours under standard operating conditions. Flying in controlled airspace also requires an AROC (radio operator's licence).`
  },
  {
    title: "Get your ReOC",
    url: "https://www.casa.gov.au/drones/remotely-piloted-aircraft-operators-certificate/get-your-reoc",
    lastUpdated: "11 Oct 2024",
    text: `A ReOC lets a business trade as a drone service provider and employ remote pilots (RePL holders — a ReOC itself is not a pilot licence) to fly RPA up to 7kg, 25kg, 150kg, or more (with extra certification), and to apply for approvals for complex operations outside the standard drone safety rules.

You do NOT need a ReOC if you operate a micro or excluded-category RPA, or fly for fun.

ReOC holders must: develop operational procedures/manuals per Part 101 (Unmanned Aircraft and Rockets) Manual of Standards 2019, train all remote pilots on those procedures, ensure operations follow the law and certificate conditions, keep required operational records, and register drones before flying.

Applying: complete Form 101-02, prepare an RPAS Operations Manual (guidance and sample manual available), submit application + documents + pay the fee, pass a Chief Remote Pilot (CRP) assessment. Applications can take up to 70 business days depending on complexity. The issued ReOC specifies RPA type, weight restrictions, and manufacturer/model (for RPA over 25kg). Basic operations under 150kg can also be applied for via an authorised industry delegate.`
  },
  {
    title: "Vary your ReOC",
    url: "https://www.casa.gov.au/drones/remotely-piloted-aircraft-operators-certificate/vary-your-reoc",
    lastUpdated: "11 Oct 2024",
    text: `Changes to a ReOC are either significant or non-significant.

Significant changes (CASA must approve before you implement them; can take up to 70 business days): changing key staff roles (CEO, chief remote pilot, chief RePL instructor, maintenance controller), changing organisational structure/reporting lines for safety-relevant roles, changing responsibilities/qualifications for staff roles, modifying the ops-manual amendment procedure, changes that could affect aviation safety, adding procedures you're not authorised for (e.g. BVLOS not yet assessed). Changes requiring the ReOC to be REISSUED: adding/removing RPA types, adding/removing a registered business name, changing the legal entity name (if ACN unchanged). Apply via Form 101-02 (reissue/key-staff changes) or the significant-change form (other significant changes), with a fee, supporting docs (updated Ops Manual), and possibly an onsite assessment.

Non-significant changes (notify CASA within 21 days of the change; no CASA review required, no fee, you may start using the new procedure immediately): adding a new RPA to Schedule 1 within your ReOC's existing approved scope, updating/removing serial numbers in Schedule 1, removing an RPA from Schedule 1, fixing typos/formatting, and safety-improving changes (adding a spotter/observer procedure, enhancing training, adding pilot recency requirements, setting duty/flying-hour limits, increasing maintenance inspection frequency). Notify via myCASA (Certificates and approvals > Manage certificates > your ReOC > "Notify CASA of a non-significant change") or by emailing the significant/non-significant change form. You'll receive an acknowledgement email; no formal assessment is done for non-significant changes.`
  }
];

function buildSystemPrompt(){
  const corpusText = CASA_CORPUS.map(c =>
    `### ${c.title}\nSource: ${c.url}\nLast updated: ${c.lastUpdated}\n${c.text}`
  ).join('\n\n');
  return `You are a compliance assistant embedded in a ReOC (Remote Operator's Certificate) flight-operations app for an Australian drone business regulated by CASA (Civil Aviation Safety Authority).

STRICT RULE: Answer ONLY using the CASA reference material below, which was fetched directly from casa.gov.au. Do not use any other knowledge, training data, or assumptions about aviation rules — even if you believe you know the answer. If the material below does not clearly answer the question, say so plainly and tell the user to check the relevant casa.gov.au page or contact CASA directly — do not guess or fill gaps.

When you do answer from the material, cite which source page(s) you used (by title) at the end of your answer.

Always end with a short reminder that this is general guidance from CASA's published pages, not a formal determination, and anything safety- or compliance-critical should be confirmed directly with CASA or myCASA.

Keep answers concise and plain-English — the person asking may be standing next to a drone deciding whether to fly.

=== CASA REFERENCE MATERIAL (snapshot, dated per page) ===

${corpusText}`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ error: 'Use POST' }); return; }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'Assistant is not configured (missing API key).' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const question = (body && body.question || '').toString().trim().slice(0, 1000);
  if (!question) { res.status(400).json({ error: 'No question provided.' }); return; }

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: question }
        ]
      })
    });
    if (!r.ok) {
      const errText = await r.text();
      res.status(502).json({ error: 'Assistant service error.', detail: errText.slice(0, 300) });
      return;
    }
    const data = await r.json();
    const answer = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    res.status(200).json({ answer: answer || "I couldn't generate a response — please try again." });
  } catch (e) {
    res.status(500).json({ error: 'Assistant request failed.', detail: String(e && e.message || e) });
  }
}
