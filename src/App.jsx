import { useState, useMemo } from "react";

const STEPS = ["Welcome","Clinical Info","Baseline Function","Your Priorities","Treatment Guide","Predicted Outcomes","ProtecT Data","Summary"];

const riskColors = {"Very Low":"#22c55e",Low:"#4ade80","Favorable Intermediate":"#facc15","Unfavorable Intermediate":"#f97316",High:"#ef4444","Very High":"#b91c1c"};

// ---- IPSS QUESTIONS (AUA Symptom Index) ----
const IPSS_QS = [
  {id:"incomplete",q:"Over the past month, how often have you had the sensation of not emptying your bladder completely after urinating?"},
  {id:"frequency",q:"Over the past month, how often have you had to urinate again less than 2 hours after you finished urinating?"},
  {id:"intermittency",q:"Over the past month, how often have you found you stopped and started again several times when you urinated?"},
  {id:"urgency",q:"Over the past month, how often have you found it difficult to postpone urination?"},
  {id:"weakstream",q:"Over the past month, how often have you had a weak urinary stream?"},
  {id:"straining",q:"Over the past month, how often have you had to push or strain to begin urination?"},
  {id:"nocturia",q:"Over the past month, how many times did you most typically get up at night to urinate?"},
];
const IPSS_OPTS = ["Not at all (0)","Less than 1 in 5 times (1)","Less than half the time (2)","About half the time (3)","More than half the time (4)","Almost always (5)"];
const IPSS_NOCT_OPTS = ["None (0)","1 time (1)","2 times (2)","3 times (3)","4 times (4)","5+ times (5)"];
const IPSS_QOL_OPTS = ["Delighted (0)","Pleased (1)","Mostly satisfied (2)","Mixed (3)","Mostly dissatisfied (4)","Unhappy (5)","Terrible (6)"];

// ---- SHIM / IIEF-5 QUESTIONS ----
const SHIM_QS = [
  {id:"confidence",q:"How do you rate your confidence that you could get and keep an erection?",opts:["Very low (1)","Low (2)","Moderate (3)","High (4)","Very high (5)"]},
  {id:"firmness",q:"When you had erections with sexual stimulation, how often were your erections hard enough for penetration?",opts:["Almost never or never (1)","A few times (2)","Sometimes (3)","Most times (4)","Almost always or always (5)"]},
  {id:"maintain",q:"During sexual intercourse, how often were you able to maintain your erection after penetration?",opts:["Almost never or never (1)","A few times (2)","Sometimes (3)","Most times (4)","Almost always or always (5)"]},
  {id:"difficulty",q:"During sexual intercourse, how difficult was it to maintain your erection to completion?",opts:["Extremely difficult (1)","Very difficult (2)","Difficult (3)","Slightly difficult (4)","Not difficult (5)"]},
  {id:"satisfaction",q:"When you attempted sexual intercourse, how often was it satisfactory for you?",opts:["Almost never or never (1)","A few times (2)","Sometimes (3)","Most times (4)","Almost always or always (5)"]},
];

// ---- ProtecT OUTCOME DATA ----
const PROTECT_DATA = {
  erectileFunction: {
    title: "Erections Firm Enough for Intercourse",unit:"%",yLabel:"% of Men",
    timepoints:["Baseline","6 mo","1 yr","2 yr","3 yr","6 yr","7 yr","12 yr"],
    series:{
      surgery:{label:"Surgery",color:"#8b5cf6",data:[67,12,17,21,21,17,18,8]},
      radiation:{label:"Radiation + ADT",color:"#f59e0b",data:[67,22,33,33,30,27,27,8]},
      monitoring:{label:"Active Monitoring",color:"#3b82f6",data:[67,52,47,44,41,30,30,8]},
    },
    insight:"Surgery causes the sharpest early decline. Radiation's early decline partly reflects ADT; function partially recovers. Active monitoring preserves function longest, but all groups converge by 12 years.",
  },
  padUse: {
    title:"Using Absorbent Pads for Leakage",unit:"%",yLabel:"% of Men Using Pads",
    timepoints:["Baseline","6 mo","1 yr","2 yr","3 yr","6 yr","12 yr"],
    series:{
      surgery:{label:"Surgery",color:"#8b5cf6",data:[1,46,26,20,18,17,21]},
      radiation:{label:"Radiation + ADT",color:"#f59e0b",data:[1,5,4,3,3,4,6]},
      monitoring:{label:"Active Monitoring",color:"#3b82f6",data:[1,4,3,5,6,8,10]},
    },
    insight:"Pad use is surgery's hallmark side effect — peaking at 46% at 6 months. Radiation has minimal continence impact. Active monitoring rises gradually as men age.",
  },
  nocturia: {
    title:"Nocturia (Waking ≥2 Times/Night)",unit:"%",yLabel:"% of Men",
    timepoints:["Baseline","6 mo","1 yr","6 yr","12 yr"],
    series:{
      surgery:{label:"Surgery",color:"#8b5cf6",data:[22,15,17,25,34]},
      radiation:{label:"Radiation + ADT",color:"#f59e0b",data:[22,35,27,38,48]},
      monitoring:{label:"Active Monitoring",color:"#3b82f6",data:[22,23,22,35,47]},
    },
    insight:"Radiation causes the most nocturia early on. By 12 years, nocturia is lowest after surgery (34%) because the prostate is removed. Radiation and monitoring reach ~47-48%.",
  },
  bowel: {
    title:"Fecal Leakage",unit:"%",yLabel:"% of Men",
    timepoints:["Baseline","6 mo","1 yr","6 yr","12 yr"],
    series:{
      surgery:{label:"Surgery",color:"#8b5cf6",data:[3,3,3,5,6]},
      radiation:{label:"Radiation + ADT",color:"#f59e0b",data:[3,8,7,9,12]},
      monitoring:{label:"Active Monitoring",color:"#3b82f6",data:[3,3,3,4,6]},
    },
    insight:"Bowel side effects are primarily a radiation concern. Fecal leakage affects ~12% of radiation patients by 12 years vs ~6% for surgery/monitoring.",
  },
};

// ---- ONCOLOGIC OUTCOMES BY GRADE GROUP ----
// BCR-free survival, metastasis-free survival, need for salvage/adjuvant treatment
// Compiled from large multi-institutional surgical and radiation series,
// ProtecT 15-year data (Hamdy et al. NEJM 2023;388:1547-1558),
// and NCCN Guidelines v2.2025
const ONCOLOGIC_BY_GRADE = {
  "6": { // Grade Group 1 — Gleason 3+3
    label: "Grade Group 1 (Gleason 6)",
    surgery: {
      bcrFree5yr: 95, bcrFree10yr: 90,
      metsFree10yr: 98, metsFree15yr: 97,
      salvageRT: 8, adjuvantNeeded: 3,
      cancerSpecificSurvival15yr: 99,
    },
    radiation: {
      bcrFree5yr: 93, bcrFree10yr: 87,
      metsFree10yr: 97, metsFree15yr: 96,
      salvageTreatment: 10,
      adtDuration: "None or 4-6 months if used",
      cancerSpecificSurvival15yr: 99,
    },
    activeSurveillance: {
      conversionToTreatment5yr: 30, conversionToTreatment10yr: 45,
      upgradeOnSurveillance: 25,
      metsFree10yr: 98, metsFree15yr: 95,
      cancerSpecificSurvival15yr: 97,
    },
    protectData: {
      note: "ProtecT: 77% were Gleason 6. PC-specific death ~3% across all groups at 15yr with no significant difference by treatment. Metastases: AM 9.4% vs surgery 4.7% vs RT 5.0% (all grades pooled).",
    },
  },
  "3+4": { // Grade Group 2 — Gleason 3+4
    label: "Grade Group 2 (Gleason 3+4)",
    surgery: {
      bcrFree5yr: 88, bcrFree10yr: 80,
      metsFree10yr: 95, metsFree15yr: 92,
      salvageRT: 18, adjuvantNeeded: 8,
      cancerSpecificSurvival15yr: 97,
    },
    radiation: {
      bcrFree5yr: 85, bcrFree10yr: 78,
      metsFree10yr: 94, metsFree15yr: 91,
      salvageTreatment: 17,
      adtDuration: "4-6 months recommended",
      cancerSpecificSurvival15yr: 97,
    },
    activeSurveillance: {
      conversionToTreatment5yr: 40, conversionToTreatment10yr: 55,
      upgradeOnSurveillance: 15,
      metsFree10yr: 94, metsFree15yr: 90,
      cancerSpecificSurvival15yr: 96,
    },
    protectData: {
      note: "ProtecT included favorable intermediate-risk patients. No significant difference in PC mortality by grade at 15 years. Radical treatment reduced metastasis risk approximately 50% vs active monitoring.",
    },
  },
  "4+3": { // Grade Group 3 — Gleason 4+3
    label: "Grade Group 3 (Gleason 4+3)",
    surgery: {
      bcrFree5yr: 78, bcrFree10yr: 63,
      metsFree10yr: 90, metsFree15yr: 85,
      salvageRT: 30, adjuvantNeeded: 15,
      cancerSpecificSurvival15yr: 93,
    },
    radiation: {
      bcrFree5yr: 76, bcrFree10yr: 65,
      metsFree10yr: 88, metsFree15yr: 83,
      salvageTreatment: 25,
      adtDuration: "6-24 months recommended",
      cancerSpecificSurvival15yr: 93,
    },
    activeSurveillance: {
      conversionToTreatment5yr: null, conversionToTreatment10yr: null,
      upgradeOnSurveillance: null,
      metsFree10yr: null, metsFree15yr: null,
      cancerSpecificSurvival15yr: null,
      note: "Not generally recommended for Grade Group 3",
    },
    protectData: {
      note: "Unfavorable intermediate-risk. ProtecT showed higher metastasis rates in the active monitoring group for this subgroup. Radical treatment strongly recommended.",
    },
  },
  "8": { // Grade Group 4 — Gleason 8
    label: "Grade Group 4 (Gleason 8)",
    surgery: {
      bcrFree5yr: 65, bcrFree10yr: 50,
      metsFree10yr: 82, metsFree15yr: 74,
      salvageRT: 40, adjuvantNeeded: 22,
      cancerSpecificSurvival15yr: 85,
    },
    radiation: {
      bcrFree5yr: 62, bcrFree10yr: 50,
      metsFree10yr: 80, metsFree15yr: 72,
      salvageTreatment: 35,
      adtDuration: "18-36 months recommended",
      cancerSpecificSurvival15yr: 84,
    },
    activeSurveillance: {
      conversionToTreatment5yr: null, conversionToTreatment10yr: null,
      upgradeOnSurveillance: null,
      metsFree10yr: null, metsFree15yr: null,
      cancerSpecificSurvival15yr: null,
      note: "Not recommended for Grade Group 4. Definitive treatment indicated.",
    },
    protectData: {
      note: "High-risk disease was a small minority in ProtecT. Current guidelines recommend definitive treatment with surgery or radiation + long-course ADT.",
    },
  },
  "9": { // Grade Group 5 — Gleason 9-10
    label: "Grade Group 5 (Gleason 9-10)",
    surgery: {
      bcrFree5yr: 50, bcrFree10yr: 35,
      metsFree10yr: 70, metsFree15yr: 60,
      salvageRT: 50, adjuvantNeeded: 30,
      cancerSpecificSurvival15yr: 72,
    },
    radiation: {
      bcrFree5yr: 48, bcrFree10yr: 38,
      metsFree10yr: 68, metsFree15yr: 58,
      salvageTreatment: 45,
      adtDuration: "24-36 months recommended",
      cancerSpecificSurvival15yr: 70,
    },
    activeSurveillance: {
      conversionToTreatment5yr: null, conversionToTreatment10yr: null,
      upgradeOnSurveillance: null,
      metsFree10yr: null, metsFree15yr: null,
      cancerSpecificSurvival15yr: null,
      note: "Not recommended. Very high-risk disease requires definitive multimodal treatment.",
    },
    protectData: {
      note: "Very high-risk. Guidelines recommend surgery + consideration of adjuvant RT, or RT + long-course ADT (± abiraterone in very high-risk per STAMPEDE/PEACE-1). Genomic testing (Decipher) may guide adjuvant decisions.",
    },
  },
};

// ---- ProtecT 15-YEAR CANCER OUTCOMES (All grades pooled) ----
const PROTECT_CANCER = {
  title: "ProtecT 15-Year Cancer Control Outcomes (All Grades Pooled, n=1,643)",
  source: "Hamdy FC et al. NEJM 2023;388:1547-1558",
  doi: "10.1056/NEJMoa2214122",
  outcomes: [
    { label: "Prostate Cancer Death", monitoring: 3.1, surgery: 2.2, radiation: 2.9, note: "No significant difference (P=0.53)" },
    { label: "All-Cause Death", monitoring: 21.7, surgery: 21.7, radiation: 21.7, note: "Similar across groups" },
    { label: "Metastases Developed", monitoring: 9.4, surgery: 4.7, radiation: 5.0, note: "Higher in monitoring group" },
    { label: "Clinical Progression", monitoring: 25.9, surgery: 10.5, radiation: 11.0, note: "Significantly higher in monitoring" },
    { label: "Started Long-Term ADT", monitoring: 12.7, surgery: 7.2, radiation: 7.7, note: "" },
    { label: "Alive Without Any Treatment (AM only)", monitoring: 24.4, surgery: null, radiation: null, note: "24% of AM group never needed treatment" },
  ],
};

// ---- GRADE GROUP OUTCOMES COMPONENT ----
function GradeGroupOutcomes({ gleason }) {
  const data = ONCOLOGIC_BY_GRADE[gleason];
  if (!data) return null;
  const s = data.surgery, r = data.radiation, a = data.activeSurveillance;
  const cellS = { textAlign: "center", padding: "8px 6px", fontWeight: 600 };
  const cellL = { textAlign: "left", padding: "8px 6px", fontSize: 13 };
  const showAS = a && a.cancerSpecificSurvival15yr !== null;
  return (
    <div style={{ marginTop: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8, letterSpacing: 0.5 }}>CANCER CONTROL</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{data.label}</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
              <th style={{ ...cellL, fontWeight: 600, color: "#64748b" }}>Outcome</th>
              <th style={{ ...cellS, color: "#8b5cf6" }}>Surgery</th>
              <th style={{ ...cellS, color: "#f59e0b" }}>Radiation</th>
              {showAS && <th style={{ ...cellS, color: "#3b82f6" }}>Active Surv.</th>}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={cellL}>BCR-Free at 5 yr</td>
              <td style={cellS}>{s.bcrFree5yr}%</td>
              <td style={cellS}>{r.bcrFree5yr}%</td>
              {showAS && <td style={{ ...cellS, color: "#94a3b8" }}>N/A</td>}
            </tr>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={cellL}>BCR-Free at 10 yr</td>
              <td style={cellS}>{s.bcrFree10yr}%</td>
              <td style={cellS}>{r.bcrFree10yr}%</td>
              {showAS && <td style={{ ...cellS, color: "#94a3b8" }}>N/A</td>}
            </tr>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={cellL}>Metastasis-Free at 10 yr</td>
              <td style={cellS}>{s.metsFree10yr}%</td>
              <td style={cellS}>{r.metsFree10yr}%</td>
              {showAS && <td style={cellS}>{a.metsFree10yr}%</td>}
            </tr>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={cellL}>Metastasis-Free at 15 yr</td>
              <td style={cellS}>{s.metsFree15yr}%</td>
              <td style={cellS}>{r.metsFree15yr}%</td>
              {showAS && <td style={cellS}>{a.metsFree15yr}%</td>}
            </tr>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={cellL}>Cancer-Specific Survival 15 yr</td>
              <td style={cellS}>{s.cancerSpecificSurvival15yr}%</td>
              <td style={cellS}>{r.cancerSpecificSurvival15yr}%</td>
              {showAS && <td style={cellS}>{a.cancerSpecificSurvival15yr}%</td>}
            </tr>
            <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fefce8" }}>
              <td style={{ ...cellL, fontWeight: 600 }}>Need Salvage/Adjuvant Tx</td>
              <td style={cellS}>{s.salvageRT}% salvage RT{s.adjuvantNeeded > 0 ? `, ${s.adjuvantNeeded}% adj RT` : ""}</td>
              <td style={cellS}>{r.salvageTreatment}%</td>
              {showAS && <td style={cellS}>{a.conversionToTreatment5yr}% by 5yr / {a.conversionToTreatment10yr}% by 10yr</td>}
            </tr>
            {showAS && (
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={cellL}>Grade Upgrade on Surveillance</td>
                <td style={{ ...cellS, color: "#94a3b8" }}>N/A</td>
                <td style={{ ...cellS, color: "#94a3b8" }}>N/A</td>
                <td style={cellS}>{a.upgradeOnSurveillance}%</td>
              </tr>
            )}
            {r.adtDuration && (
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={cellL}>ADT Duration with Radiation</td>
                <td style={{ ...cellS, color: "#94a3b8" }}>N/A</td>
                <td style={{ ...cellS, fontSize: 11 }}>{r.adtDuration}</td>
                {showAS && <td style={{ ...cellS, color: "#94a3b8" }}>N/A</td>}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!showAS && a && a.note && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 10, marginTop: 8, fontSize: 12, color: "#991b1b" }}>
          <strong>Active Surveillance:</strong> {a.note}
        </div>
      )}
      {data.protectData && data.protectData.note && (
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: 10, marginTop: 8, fontSize: 12, color: "#0c4a6e" }}>
          <strong>ProtecT Trial Context:</strong> {data.protectData.note}
        </div>
      )}
    </div>
  );
}

function CancerControlSummary() {
  const d = PROTECT_CANCER;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>ProtecT 15-YEAR</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>Cancer Control (All Grades)</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
              <th style={{ textAlign: "left", padding: "8px 6px", color: "#64748b", fontWeight: 600 }}>Outcome at 15 yr</th>
              <th style={{ textAlign: "center", padding: "8px 6px", color: "#3b82f6", fontWeight: 600 }}>Monitoring</th>
              <th style={{ textAlign: "center", padding: "8px 6px", color: "#8b5cf6", fontWeight: 600 }}>Surgery</th>
              <th style={{ textAlign: "center", padding: "8px 6px", color: "#f59e0b", fontWeight: 600 }}>Radiation</th>
            </tr>
          </thead>
          <tbody>
            {d.outcomes.filter(o => o.surgery !== null).map((o, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ textAlign: "left", padding: "8px 6px", fontSize: 12 }}>{o.label}</td>
                <td style={{ textAlign: "center", padding: "8px 6px", fontWeight: 600 }}>{o.monitoring}%</td>
                <td style={{ textAlign: "center", padding: "8px 6px", fontWeight: 600 }}>{o.surgery}%</td>
                <td style={{ textAlign: "center", padding: "8px 6px", fontWeight: 600 }}>{o.radiation}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>Source: {d.source} (DOI: {d.doi})</div>
    </div>
  );
}

// ---- RISK CLASSIFICATION ----
function classifyRisk(c) {
  const g=parseInt(c.gleason),p=parseFloat(c.psa);
  if(!g||isNaN(p)||!c.stage) return null;
  if(g>=9||c.stage==="T3b-T4") return "Very High";
  if(g===8||p>=20||c.stage==="T3a") return "High";
  if(g===7&&c.gleason==="4+3") return "Unfavorable Intermediate";
  if(g===7&&c.gleason==="3+4"){
    if(parseInt(c.positiveCores)>3||parseInt(c.percentCores)>50) return "Unfavorable Intermediate";
    return "Favorable Intermediate";
  }
  if(p>=10&&p<20) return "Favorable Intermediate";
  if(g===6&&p<10&&(c.stage==="T1c"||c.stage==="T2a")){
    if(parseInt(c.positiveCores)<=2&&parseInt(c.percentCores)<=50&&p<10){
      if(parseFloat(c.psaDensity)<0.15) return "Very Low";
      return "Low";
    }
    return "Low";
  }
  if(g===6) return "Low";
  return "Favorable Intermediate";
}

// ---- PERSONALIZED OUTCOME PREDICTION ENGINE ----
// Adjusts ProtecT population-level rates based on patient-specific baseline scores
function predictOutcomes(baseline) {
  const {ipssTotal, ipssQol, shimTotal, bmi, age, diabetes, priorTurp, sexuallyActive} = baseline;
  const a = parseInt(age)||62;
  const b = parseFloat(bmi)||27;
  const ipss = parseInt(ipssTotal)||7;
  const shim = parseInt(shimTotal)||22;

  // Erectile function multipliers (applied to ProtecT recovery rates)
  let edBase = 1.0;
  // SHIM-based adjustment (strongest predictor)
  if(shim>=22) edBase=1.0;
  else if(shim>=17) edBase=0.72;
  else if(shim>=12) edBase=0.48;
  else if(shim>=8) edBase=0.28;
  else edBase=0.12;
  // Age adjustment
  if(a<55) edBase*=1.25;
  else if(a>65) edBase*=0.70;
  else if(a>70) edBase*=0.50;
  // BMI adjustment
  if(b>=35) edBase*=0.70;
  else if(b>=30) edBase*=0.82;
  // Diabetes
  if(diabetes) edBase*=0.72;

  // Continence multipliers (applied to ProtecT pad-use rates — higher = worse)
  let continBase = 1.0;
  if(a<55) continBase=0.65;
  else if(a>70) continBase=1.45;
  else if(a>65) continBase=1.20;
  if(b>=35) continBase*=1.35;
  else if(b>=30) continBase*=1.15;
  if(ipss>19) continBase*=1.30;
  else if(ipss>7) continBase*=1.10;
  if(priorTurp) continBase*=1.40;

  // Voiding / nocturia adjustment
  let voidBase = 1.0;
  if(ipss>19) voidBase=1.40;
  else if(ipss>7) voidBase=1.15;

  // Bowel — less patient-specific, mostly technique-dependent
  let bowelBase = 1.0;

  const cap = (v,mn=0,mx=100)=>Math.max(mn,Math.min(mx,Math.round(v)));

  // Generate personalized projections at key timepoints
  // Surgery outcomes
  const surgery = {
    erection: {
      sixMo: cap(12*edBase), oneYr: cap(17*edBase), twoYr: cap(21*edBase),
      threeYr: cap(21*edBase), sixYr: cap(17*edBase),
    },
    pads: {
      sixMo: cap(46*continBase), oneYr: cap(26*continBase), twoYr: cap(20*continBase),
      sixYr: cap(17*continBase),
    },
    nocturia: { sixMo: cap(15*voidBase), oneYr: cap(17*voidBase), sixYr: cap(25*voidBase) },
    bowel: { sixMo: 3, sixYr: cap(5*bowelBase) },
  };

  // Radiation outcomes
  const radiation = {
    erection: {
      sixMo: cap(22*edBase), oneYr: cap(33*edBase), twoYr: cap(33*edBase),
      threeYr: cap(30*edBase), sixYr: cap(27*edBase),
    },
    pads: {
      sixMo: cap(5*continBase*0.3), oneYr: cap(4*continBase*0.3), twoYr: cap(3*continBase*0.3),
      sixYr: cap(4*continBase*0.3),
    },
    nocturia: { sixMo: cap(35*voidBase), oneYr: cap(27*voidBase), sixYr: cap(38*voidBase) },
    bowel: { sixMo: 8, sixYr: cap(9*bowelBase) },
  };

  // Active monitoring
  const monitoring = {
    erection: {
      sixMo: cap(52*edBase), oneYr: cap(47*edBase), twoYr: cap(44*edBase),
      threeYr: cap(41*edBase), sixYr: cap(30*edBase),
    },
    pads: {
      sixMo: cap(4*continBase*0.5), oneYr: cap(3*continBase*0.5), twoYr: cap(5*continBase*0.5),
      sixYr: cap(8*continBase*0.6),
    },
    nocturia: { sixMo: cap(23*voidBase), oneYr: cap(22*voidBase), sixYr: cap(35*voidBase) },
    bowel: { sixMo: 3, sixYr: cap(4*bowelBase) },
  };

  return {surgery, radiation, monitoring, factors:{edBase,continBase,voidBase,shimCategory:
    shim>=22?"Normal":shim>=17?"Mild ED":shim>=12?"Mild-Moderate ED":shim>=8?"Moderate ED":"Severe ED",
    ipssCategory: ipss<=7?"Mild":ipss<=19?"Moderate":"Severe",
    bmiCategory: b<25?"Normal":b<30?"Overweight":b<35?"Obese":"Severely Obese",
  }};
}

// ---- SVG CHART ----
function OutcomeChart({data,height=260}) {
  const [hp,setHp]=useState(null);
  const sk=Object.keys(data.series);
  const allV=sk.flatMap(k=>data.series[k].data);
  const mx=Math.max(...allV),mn=Math.max(0,Math.min(...allV)-5);
  const yMax=mx+10,yMin=mn,yR=yMax-yMin||1;
  const cW=620,cH=height-60,pL=50,pR=20,pT=10,pB=40;
  const plW=cW-pL-pR,plH=cH-pT-pB;
  const xS=plW/(data.timepoints.length-1||1);
  const gX=i=>pL+i*xS, gY=v=>pT+plH-((v-yMin)/yR)*plH;
  const gLines=5,gVals=Array.from({length:gLines},(_,i)=>yMin+(yR/(gLines-1))*i);
  return(
    <div style={{overflowX:"auto"}}>
      <svg width={cW} height={cH} style={{display:"block",margin:"0 auto"}}>
        {gVals.map((v,i)=><g key={i}><line x1={pL} y1={gY(v)} x2={cW-pR} y2={gY(v)} stroke="#e2e8f0" strokeWidth={1}/><text x={pL-8} y={gY(v)+4} textAnchor="end" fontSize={11} fill="#94a3b8">{Math.round(v)}{data.unit==="%"?"%":""}</text></g>)}
        {data.timepoints.map((tp,i)=><text key={i} x={gX(i)} y={cH-8} textAnchor="middle" fontSize={10} fill="#64748b">{tp}</text>)}
        {sk.map(s=>{const d=data.series[s];return(<g key={s}><polyline fill="none" stroke={d.color} strokeWidth={2.5} points={d.data.map((v,i)=>`${gX(i)},${gY(v)}`).join(" ")} strokeLinejoin="round"/>{d.data.map((v,i)=><g key={i}><circle cx={gX(i)} cy={gY(v)} r={hp===`${s}-${i}`?6:4} fill={d.color} stroke="#fff" strokeWidth={2} style={{cursor:"pointer"}} onMouseEnter={()=>setHp(`${s}-${i}`)} onMouseLeave={()=>setHp(null)}/>{hp===`${s}-${i}`&&<g><rect x={gX(i)-28} y={gY(v)-26} width={56} height={20} rx={4} fill="#1e293b" opacity={0.9}/><text x={gX(i)} y={gY(v)-12} textAnchor="middle" fontSize={11} fill="#fff" fontWeight={600}>{v}{data.unit==="%"?"%":""}</text></g>}</g>)}</g>)})}
      </svg>
      <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:8,flexWrap:"wrap"}}>
        {sk.map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}><div style={{width:14,height:3,background:data.series[s].color,borderRadius:2}}/><span style={{color:"#64748b"}}>{data.series[s].label}</span></div>)}
      </div>
    </div>
  );
}

// ---- HORIZONTAL BAR ----
function HBar({label,value,max=100,color,suffix="%"}){
  const pct=Math.min(100,(value/max)*100);
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
      <div style={{width:120,fontSize:12,color:"#64748b",flexShrink:0}}>{label}</div>
      <div style={{flex:1,background:"#f1f5f9",borderRadius:4,height:20,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:4,transition:"width 0.5s",minWidth:value>0?30:0,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6}}>
          <span style={{fontSize:11,fontWeight:700,color:"#fff"}}>{value}{suffix}</span>
        </div>
      </div>
    </div>
  );
}

// ---- REUSABLE UI ----
function ProgressBar({step,total}){return(<div style={{display:"flex",gap:4,marginBottom:32}}>{Array.from({length:total}).map((_,i)=><div key={i} style={{flex:1,height:6,borderRadius:3,background:i<=step?"#2563eb":"#e2e8f0",transition:"background 0.3s"}}/>)}</div>);}
function Card({children,style,onClick,selected}){return(<div onClick={onClick} style={{background:selected?"#eff6ff":"#fff",border:selected?"2px solid #2563eb":"1px solid #e2e8f0",borderRadius:12,padding:20,cursor:onClick?"pointer":"default",transition:"all 0.2s",...style}}>{children}</div>);}
function SelectCard({label,desc,selected,onClick,icon}){return(<Card onClick={onClick} selected={selected} style={{marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:12}}>{icon&&<span style={{fontSize:24}}>{icon}</span>}<div><div style={{fontWeight:600,color:"#1e293b"}}>{label}</div>{desc&&<div style={{fontSize:13,color:"#64748b",marginTop:2}}>{desc}</div>}</div><div style={{marginLeft:"auto"}}><div style={{width:22,height:22,borderRadius:11,border:selected?"none":"2px solid #cbd5e1",background:selected?"#2563eb":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{selected&&<span style={{color:"#fff",fontSize:14}}>✓</span>}</div></div></div></Card>);}
function Slider({label,value,onChange,leftLabel,rightLabel}){return(<div style={{marginBottom:24}}><div style={{fontWeight:600,color:"#1e293b",marginBottom:8}}>{label}</div><input type="range" min={1} max={5} value={value} onChange={e=>onChange(parseInt(e.target.value))} style={{width:"100%",accentColor:"#2563eb"}}/><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#94a3b8"}}><span>{leftLabel}</span><span>{rightLabel}</span></div></div>);}

function ScoreBadge({label,value,color,max}){
  return(<div style={{background:`${color}15`,border:`1px solid ${color}40`,borderRadius:10,padding:"10px 14px",textAlign:"center",minWidth:100}}>
    <div style={{fontSize:24,fontWeight:800,color}}>{value}{max?<span style={{fontSize:14,fontWeight:400}}>/{max}</span>:null}</div>
    <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginTop:2}}>{label}</div>
  </div>);
}

function PredictionRow({label,timeLabel,surgery,radiation,monitoring}){
  return(
    <div style={{marginBottom:16}}>
      <div style={{fontWeight:600,fontSize:13,color:"#1e293b",marginBottom:2}}>{label}</div>
      <div style={{fontSize:11,color:"#94a3b8",marginBottom:6}}>{timeLabel}</div>
      <HBar label="Surgery" value={surgery} color="#8b5cf6"/>
      <HBar label="Radiation" value={radiation} color="#f59e0b"/>
      <HBar label="Monitoring" value={monitoring} color="#3b82f6"/>
    </div>
  );
}

// ---- MAIN ----
export default function ProstateCancerDecisionGuide() {
  const [step,setStep]=useState(0);
  const [clinical,setClinical]=useState({psa:"",gleason:"",stage:"",positiveCores:"",totalCores:"",percentCores:"",psaDensity:"",age:"",mriPirads:""});
  const [ipss,setIpss]=useState({incomplete:-1,frequency:-1,intermittency:-1,urgency:-1,weakstream:-1,straining:-1,nocturia:-1,qol:-1});
  const [shim,setShim]=useState({confidence:-1,firmness:-1,maintain:-1,difficulty:-1,satisfaction:-1});
  const [bodyMetrics,setBodyMetrics]=useState({heightFt:"",heightIn:"",weightLbs:"",diabetes:false,priorTurp:false,sexuallyActive:true});
  const [priorities,setPriorities]=useState({avoidSideEffects:3,certaintyOfCure:3,minimizeRecovery:3,preserveErections:3,avoidOngoing:3,preserveBowel:3});
  const [expandedTreatment,setExpandedTreatment]=useState(null);
  const [activeOutcome,setActiveOutcome]=useState("erectileFunction");

  const risk=useMemo(()=>classifyRisk(clinical),[clinical]);

  // Score calculations
  const ipssTotal=useMemo(()=>{
    const vals=IPSS_QS.map(q=>ipss[q.id]);
    if(vals.some(v=>v<0)) return null;
    return vals.reduce((a,b)=>a+b,0);
  },[ipss]);
  const ipssQol=ipss.qol>=0?ipss.qol:null;
  const shimTotal=useMemo(()=>{
    if(!bodyMetrics.sexuallyActive) return 1; // severe ED / not active
    const vals=SHIM_QS.map(q=>shim[q.id]);
    if(vals.some(v=>v<0)) return null;
    return vals.reduce((a,b)=>a+b,0);
  },[shim,bodyMetrics.sexuallyActive]);
  const bmi=useMemo(()=>{
    const ft=parseFloat(bodyMetrics.heightFt)||0;
    const inches=parseFloat(bodyMetrics.heightIn)||0;
    const totalIn=ft*12+inches;
    const lbs=parseFloat(bodyMetrics.weightLbs)||0;
    if(totalIn<48||lbs<80) return null;
    return Math.round((lbs/(totalIn*totalIn))*703*10)/10;
  },[bodyMetrics]);

  const predictions=useMemo(()=>{
    return predictOutcomes({
      ipssTotal:ipssTotal||7,ipssQol:ipssQol||2,shimTotal:shimTotal||22,
      bmi:bmi||27,age:clinical.age||62,
      diabetes:bodyMetrics.diabetes,priorTurp:bodyMetrics.priorTurp,
      sexuallyActive:bodyMetrics.sexuallyActive,
    });
  },[ipssTotal,ipssQol,shimTotal,bmi,clinical.age,bodyMetrics]);

  // Treatment scoring
  const treatments = useMemo(()=>({
    activeSurveillance:{name:"Active Surveillance",icon:"👁️",color:"#3b82f6",shortDesc:"Monitor closely, treat only if cancer progresses",suited:["Very Low","Low","Favorable Intermediate"],
      details:{approach:"Regular PSA tests, MRI imaging, and periodic biopsies. Treatment only if cancer progresses.",tenYearSurvival:"~99% (low-risk)",recovery:"No recovery — normal life continues",considerations:["Avoids or delays treatment side effects","~30-40% may eventually need treatment within 10 years","Requires commitment to regular follow-up","Best evidence for low-risk and very low-risk disease","Growing evidence supports use in favorable intermediate-risk"]}},
    surgery:{name:"Radical Prostatectomy",icon:"🔬",color:"#8b5cf6",shortDesc:"Surgical removal of the prostate gland",suited:["Very Low","Low","Favorable Intermediate","Unfavorable Intermediate","High","Very High"],
      details:{approach:"Removal of entire prostate, usually robotically. May include pelvic lymph node dissection.",tenYearSurvival:"~95-99% (varies by risk)",recovery:"1-3 weeks off work; 4-6 weeks full activity",considerations:["Definitive pathologic staging","PSA becomes undetectable","Radiation can be added later if needed","Nerve-sparing preserves erections in many men","Younger, healthier patients recover better"]}},
    radiation:{name:"Radiation Therapy",icon:"☢️",color:"#f59e0b",shortDesc:"External beam radiation ± brachytherapy ± hormone therapy",suited:["Very Low","Low","Favorable Intermediate","Unfavorable Intermediate","High","Very High"],
      details:{approach:"EBRT (5-40 sessions) and/or brachytherapy. Often combined with ADT for intermediate/high-risk.",tenYearSurvival:"~95-99% (comparable to surgery)",recovery:"Most continue normal activities during treatment",considerations:["Non-invasive — no incision","SBRT (5 sessions) increasingly standard for low/intermediate","ADT typically 6-36 months for intermediate/high-risk","Salvage surgery after RT is technically challenging","Side effects develop gradually over months-years"]}},
    focalTherapy:{name:"Focal Therapy",icon:"🎯",color:"#10b981",shortDesc:"Targeted treatment of the cancer focus only (HIFU, IRE, cryotherapy)",suited:["Very Low","Low","Favorable Intermediate","Unfavorable Intermediate"],
      details:{
        approach:"Treats only the cancer area within the prostate, preserving healthy tissue. Technologies include HIFU (high-intensity focused ultrasound), IRE (irreversible electroporation / Nanoknife), cryotherapy, and laser ablation.",
        tenYearSurvival:"No 10-year data available. Best available: 7-yr failure-free survival 69% (HEAT Registry, n=1,379)",
        recovery:"Outpatient or overnight; return to activity in 1-2 weeks",
        focalTrialData: {
          heat: {
            name: "HEAT Registry (Reddy et al, Eur Urol 2022)",
            n: 1379,
            design: "Multi-institute UK registry, focal HIFU, 15-year experience",
            population: "65% intermediate-risk, 28% high-risk, median age 66",
            ffs7yr: { all: 69, low: 88, intermediate: 68, high: 65 },
            salvageFree7yr: 75,
            adtFree7yr: 92,
            metsFree7yr: 100,
            pcSpecificSurvival7yr: 100,
            overallSurvival7yr: 97,
            retreatmentRate: 18,
            salvageWholeGland: 7,
          },
          hifi: {
            name: "HIFI Trial (Ploussard et al, Eur Urol 2025)",
            n: 3328,
            design: "Prospective nonrandomized, HIFU vs RP, 46 centers in France",
            population: "Low/intermediate-risk; HIFU median age 74.7, RP 65.1",
            stfs30mo: { hifu: 90, rp: 86 },
            noninferiority: "HR 0.71 (95% CI 0.52-0.97, p=0.008) — noninferiority demonstrated",
            metastasis: "0 in either group at 30 months",
            continence12mo: "HIFU 29% deterioration vs RP 44%",
            iief5drop: "HIFU decrease of 7 pts vs RP decrease of 13 pts",
          },
          ireImmuno: {
            name: "IRE-IMMUNO (Geboers et al, BJU Int 2025)",
            n: 30,
            design: "Prospective immune monitoring, IRE vs RARP",
            finding: "IRE depleted regulatory T-cells (p=0.0001) and activated anti-tumor CD4+/CD8+ T-cells. Prostate-specific T-cell responses in 4/8 patients. Suggests IRE may have immunomodulatory benefits not seen with surgery.",
          },
        },
        considerations:[
          "CRITICAL: No randomized comparative trial vs surgery/RT with 10+ year follow-up",
          "HEAT Registry: 7-yr failure-free survival 69% in 1,379 patients (largest focal therapy series); 7-yr metastasis-free survival 100%, PC death <0.1%",
          "HIFI Trial: First prospective comparison — HIFU noninferior to surgery at 30 months (STFS 90% vs 86%, HR 0.71), with better continence and sexual function",
          "IRE-IMMUNO: IRE may activate anti-tumor immunity — depletes regulatory T-cells and induces prostate-specific T-cell responses (exploratory, n=30)",
          "~18-20% need a repeat focal session; ~7% need salvage whole-gland treatment at 7 years",
          "Best for MRI-visible, unilateral or bilateral lesions with GG 1-3 disease",
          "Can be followed by definitive treatment if needed — does not 'burn bridges'",
          "Not yet standard of care in all guidelines — growing evidence but long-term data gap remains the key limitation",
        ],
      }},
  }),[]);

  function scoreTreatments(){
    if(!risk) return [];
    const p=priorities,sc={};
    if(["Very Low","Low","Favorable Intermediate"].includes(risk))
      sc.activeSurveillance=p.avoidSideEffects*5+p.certaintyOfCure*2+p.minimizeRecovery*5+p.preserveErections*5+p.avoidOngoing*1+p.preserveBowel*5;
    sc.surgery=p.avoidSideEffects*2+p.certaintyOfCure*5+p.minimizeRecovery*2+p.preserveErections*3+p.avoidOngoing*5+p.preserveBowel*5;
    sc.radiation=p.avoidSideEffects*3+p.certaintyOfCure*5+p.minimizeRecovery*4+p.preserveErections*3.5+p.avoidOngoing*3+p.preserveBowel*3;
    if(["Very Low","Low","Favorable Intermediate"].includes(risk))
      sc.focalTherapy=p.avoidSideEffects*4.5+p.certaintyOfCure*3+p.minimizeRecovery*4.5+p.preserveErections*5+p.avoidOngoing*3.5+p.preserveBowel*5;
    const a=parseInt(clinical.age);
    if(a>=70){if(sc.activeSurveillance!==undefined) sc.activeSurveillance+=5;sc.radiation+=3;}
    if(a<55) sc.surgery+=4;
    // Adjust for baseline function
    if(shimTotal!==null&&shimTotal<12){if(sc.activeSurveillance!==undefined)sc.activeSurveillance+=2;}
    if(ipssTotal!==null&&ipssTotal>19){sc.surgery+=2;} // benefits from removing obstructing prostate
    return Object.entries(sc).map(([k,s])=>({key:k,...treatments[k],score:s})).sort((a,b)=>b.score-a.score);
  }
  const rankedTreatments=useMemo(scoreTreatments,[risk,priorities,clinical,shimTotal,ipssTotal,treatments]);

  const canProceed=()=>{
    if(step===1) return clinical.psa&&clinical.gleason&&clinical.stage&&clinical.age;
    if(step===2) return true; // baseline function is all optional with defaults
    return true;
  };

  const cs={maxWidth:720,margin:"0 auto",padding:"24px 16px",fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',color:"#1e293b",lineHeight:1.6};
  const btnP={background:"#2563eb",color:"#fff",border:"none",borderRadius:8,padding:"12px 32px",fontSize:15,fontWeight:600,cursor:"pointer"};
  const btnS={background:"transparent",color:"#2563eb",border:"1px solid #2563eb",borderRadius:8,padding:"12px 32px",fontSize:15,fontWeight:600,cursor:"pointer"};
  const inp={width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:15,boxSizing:"border-box",outline:"none"};
  const lbl={display:"block",fontWeight:600,marginBottom:6,fontSize:14};

  // ==== STEP 0: WELCOME ====
  if(step===0){return(
    <div style={cs}><ProgressBar step={0} total={STEPS.length}/>
      <div style={{textAlign:"center",padding:"40px 0"}}>
        <div style={{fontSize:48,marginBottom:16}}>🩺</div>
        <h1 style={{fontSize:28,fontWeight:700,marginBottom:8}}>Dr. Schurhamer's Prostate Cancer Treatment Guide</h1>
        <p style={{color:"#64748b",fontSize:16,maxWidth:520,margin:"0 auto 8px"}}>A personalized decision aid using validated instruments, ProtecT trial outcomes, and contemporary focal therapy data to help you understand how each treatment may affect YOUR quality of life and cancer control.</p>
        <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:16,margin:"20px auto",maxWidth:520,fontSize:13,color:"#1e40af",textAlign:"left"}}>
          <strong>New — Personalized Predictions:</strong> Enter your IPSS (urinary symptoms), SHIM (sexual function), and BMI to get individualized outcome estimates adjusted from the ProtecT trial's 1,643-patient dataset.
        </div>
        <div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:16,margin:"12px auto",maxWidth:520,fontSize:13,color:"#92400e",textAlign:"left"}}>
          <strong>Important:</strong> This tool is for educational purposes and shared decision-making. It does not replace professional medical advice.
        </div>
        <p style={{fontSize:14,color:"#94a3b8",marginBottom:32}}>You will need your PSA, Gleason score, clinical stage, and biopsy details.</p>
        <button style={btnP} onClick={()=>setStep(1)}>Get Started →</button>
      </div>
    </div>
  );}

  // ==== STEP 1: CLINICAL INFO ====
  if(step===1){return(
    <div style={cs}><ProgressBar step={1} total={STEPS.length}/>
      <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Your Cancer Details</h2>
      <p style={{color:"#64748b",fontSize:14,marginBottom:24}}>Enter information from your biopsy report.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div><label style={lbl}>PSA (ng/mL)</label><input style={inp} type="number" step="0.1" placeholder="e.g. 5.2" value={clinical.psa} onChange={e=>setClinical({...clinical,psa:e.target.value})}/></div>
        <div><label style={lbl}>Gleason Score</label><select style={inp} value={clinical.gleason} onChange={e=>setClinical({...clinical,gleason:e.target.value})}><option value="">Select...</option><option value="6">6 (3+3) — GG 1</option><option value="3+4">7 (3+4) — GG 2</option><option value="4+3">7 (4+3) — GG 3</option><option value="8">8 (4+4/3+5/5+3) — GG 4</option><option value="9">9-10 — GG 5</option></select></div>
        <div><label style={lbl}>Clinical Stage</label><select style={inp} value={clinical.stage} onChange={e=>setClinical({...clinical,stage:e.target.value})}><option value="">Select...</option><option value="T1c">T1c</option><option value="T2a">T2a</option><option value="T2b">T2b</option><option value="T2c">T2c</option><option value="T3a">T3a</option><option value="T3b-T4">T3b-T4</option></select></div>
        <div><label style={lbl}>Age</label><input style={inp} type="number" placeholder="e.g. 63" value={clinical.age} onChange={e=>setClinical({...clinical,age:e.target.value})}/></div>
        <div><label style={lbl}>Positive Cores</label><input style={inp} type="number" placeholder="e.g. 2" value={clinical.positiveCores} onChange={e=>setClinical({...clinical,positiveCores:e.target.value})}/></div>
        <div><label style={lbl}>Total Cores</label><input style={inp} type="number" placeholder="e.g. 12" value={clinical.totalCores} onChange={e=>setClinical({...clinical,totalCores:e.target.value})}/></div>
        <div><label style={lbl}>Max % Cancer in Core</label><input style={inp} type="number" placeholder="e.g. 30" value={clinical.percentCores} onChange={e=>setClinical({...clinical,percentCores:e.target.value})}/></div>
        <div><label style={lbl}>PSA Density (optional)</label><input style={inp} type="number" step="0.01" placeholder="e.g. 0.12" value={clinical.psaDensity} onChange={e=>setClinical({...clinical,psaDensity:e.target.value})}/></div>
      </div>
      {risk&&<div style={{marginTop:24,padding:16,borderRadius:10,background:`${riskColors[risk]}15`,border:`1px solid ${riskColors[risk]}40`}}><div style={{fontWeight:700,fontSize:16,color:riskColors[risk]}}>Risk Group: {risk}</div><div style={{fontSize:13,color:"#64748b",marginTop:4}}>NCCN risk stratification</div></div>}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:32}}>
        <button style={btnS} onClick={()=>setStep(0)}>← Back</button>
        <button style={{...btnP,opacity:canProceed()?1:0.4}} disabled={!canProceed()} onClick={()=>setStep(2)}>Continue →</button>
      </div>
    </div>
  );}

  // ==== STEP 2: BASELINE FUNCTION (IPSS + SHIM + BMI) ====
  if(step===2){
    const ipssComplete=IPSS_QS.every(q=>ipss[q.id]>=0);
    const shimComplete=SHIM_QS.every(q=>shim[q.id]>=0)||!bodyMetrics.sexuallyActive;
    const ipssColor=ipssTotal===null?"#94a3b8":ipssTotal<=7?"#22c55e":ipssTotal<=19?"#f59e0b":"#ef4444";
    const shimColor=shimTotal===null?"#94a3b8":shimTotal>=22?"#22c55e":shimTotal>=17?"#4ade80":shimTotal>=12?"#f59e0b":shimTotal>=8?"#f97316":"#ef4444";
    const bmiColor=bmi===null?"#94a3b8":bmi<25?"#22c55e":bmi<30?"#f59e0b":bmi<35?"#f97316":"#ef4444";
    return(
      <div style={cs}><ProgressBar step={2} total={STEPS.length}/>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Baseline Function Assessment</h2>
        <p style={{color:"#64748b",fontSize:14,marginBottom:8}}>These validated questionnaires help predict YOUR personal outcomes after treatment. Complete what you can — defaults are used for unanswered items.</p>

        {/* Score Dashboard */}
        <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"}}>
          <ScoreBadge label={ipssTotal===null?"IPSS":"IPSS: "+(ipssTotal<=7?"Mild":ipssTotal<=19?"Moderate":"Severe")} value={ipssTotal!==null?ipssTotal:"—"} color={ipssColor} max={35}/>
          <ScoreBadge label={shimTotal===null?"SHIM/IIEF-5":shimTotal>=22?"Normal":shimTotal>=17?"Mild ED":shimTotal>=12?"Mild-Mod ED":shimTotal>=8?"Moderate ED":"Severe ED"} value={shimTotal!==null?shimTotal:"—"} color={shimColor} max={25}/>
          <ScoreBadge label={bmi===null?"BMI":bmi<25?"Normal BMI":bmi<30?"Overweight":bmi<35?"Obese":"Severely Obese"} value={bmi!==null?bmi:"—"} color={bmiColor}/>
        </div>

        {/* IPSS Section */}
        <Card style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{background:"#7c3aed",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8}}>IPSS</span>
            <span style={{fontWeight:700,fontSize:15}}>International Prostate Symptom Score</span>
          </div>
          <p style={{fontSize:13,color:"#64748b",marginBottom:16}}>Rate each urinary symptom over the past month. Score: 0-7 Mild, 8-19 Moderate, 20-35 Severe.</p>
          {IPSS_QS.map((q,qi)=>(
            <div key={q.id} style={{marginBottom:16,paddingBottom:16,borderBottom:qi<6?"1px solid #f1f5f9":"none"}}>
              <div style={{fontSize:13,fontWeight:600,color:"#1e293b",marginBottom:8}}>{qi+1}. {q.q}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {(qi===6?IPSS_NOCT_OPTS:IPSS_OPTS).map((opt,oi)=>(
                  <button key={oi} onClick={()=>setIpss({...ipss,[q.id]:oi})} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:ipss[q.id]===oi?700:400,cursor:"pointer",border:ipss[q.id]===oi?"2px solid #7c3aed":"1px solid #e2e8f0",background:ipss[q.id]===oi?"#f5f3ff":"#fff",color:ipss[q.id]===oi?"#7c3aed":"#64748b"}}>{opt}</button>
                ))}
              </div>
            </div>
          ))}
          {/* QoL question */}
          <div style={{marginTop:8,paddingTop:16,borderTop:"2px solid #e2e8f0"}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1e293b",marginBottom:8}}>Quality of Life: If you had to spend the rest of your life with your urinary condition the way it is now, how would you feel?</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {IPSS_QOL_OPTS.map((opt,oi)=>(
                <button key={oi} onClick={()=>setIpss({...ipss,qol:oi})} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:ipss.qol===oi?700:400,cursor:"pointer",border:ipss.qol===oi?"2px solid #7c3aed":"1px solid #e2e8f0",background:ipss.qol===oi?"#f5f3ff":"#fff",color:ipss.qol===oi?"#7c3aed":"#64748b"}}>{opt}</button>
              ))}
            </div>
          </div>
        </Card>

        {/* SHIM Section */}
        <Card style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{background:"#2563eb",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8}}>SHIM</span>
            <span style={{fontWeight:700,fontSize:15}}>Sexual Health Inventory for Men (IIEF-5)</span>
          </div>
          <p style={{fontSize:13,color:"#64748b",marginBottom:12}}>Score: 22-25 Normal, 17-21 Mild ED, 12-16 Mild-Moderate, 8-11 Moderate, 5-7 Severe ED.</p>

          <div style={{marginBottom:16}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}>
              <input type="checkbox" checked={!bodyMetrics.sexuallyActive} onChange={e=>setBodyMetrics({...bodyMetrics,sexuallyActive:!e.target.checked})} style={{width:18,height:18,accentColor:"#2563eb"}}/>
              <span>I have not been sexually active recently</span>
            </label>
          </div>

          {bodyMetrics.sexuallyActive && SHIM_QS.map((q,qi)=>(
            <div key={q.id} style={{marginBottom:16,paddingBottom:16,borderBottom:qi<4?"1px solid #f1f5f9":"none"}}>
              <div style={{fontSize:13,fontWeight:600,color:"#1e293b",marginBottom:8}}>{qi+1}. {q.q}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {q.opts.map((opt,oi)=>(
                  <button key={oi} onClick={()=>setShim({...shim,[q.id]:oi+1})} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:shim[q.id]===oi+1?700:400,cursor:"pointer",border:shim[q.id]===oi+1?"2px solid #2563eb":"1px solid #e2e8f0",background:shim[q.id]===oi+1?"#eff6ff":"#fff",color:shim[q.id]===oi+1?"#2563eb":"#64748b"}}>{opt}</button>
                ))}
              </div>
            </div>
          ))}
          {!bodyMetrics.sexuallyActive && <div style={{background:"#f8fafc",borderRadius:8,padding:12,fontSize:13,color:"#64748b"}}>SHIM scored as severe baseline ED. Erectile function predictions will be adjusted accordingly.</div>}
        </Card>

        {/* BMI & Comorbidities */}
        <Card style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{background:"#059669",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8}}>BODY</span>
            <span style={{fontWeight:700,fontSize:15}}>BMI & Health Factors</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
            <div><label style={lbl}>Height (ft)</label><input style={inp} type="number" placeholder="5" value={bodyMetrics.heightFt} onChange={e=>setBodyMetrics({...bodyMetrics,heightFt:e.target.value})}/></div>
            <div><label style={lbl}>Height (in)</label><input style={inp} type="number" placeholder="10" value={bodyMetrics.heightIn} onChange={e=>setBodyMetrics({...bodyMetrics,heightIn:e.target.value})}/></div>
            <div><label style={lbl}>Weight (lbs)</label><input style={inp} type="number" placeholder="185" value={bodyMetrics.weightLbs} onChange={e=>setBodyMetrics({...bodyMetrics,weightLbs:e.target.value})}/></div>
          </div>
          {bmi&&<div style={{fontSize:14,fontWeight:600,color:bmiColor,marginBottom:16}}>BMI: {bmi} ({bmi<25?"Normal":bmi<30?"Overweight":bmi<35?"Obese Class I":"Obese Class II+"})</div>}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}>
              <input type="checkbox" checked={bodyMetrics.diabetes} onChange={e=>setBodyMetrics({...bodyMetrics,diabetes:e.target.checked})} style={{width:18,height:18,accentColor:"#2563eb"}}/>
              <span>Diabetes (Type 1 or Type 2)</span>
            </label>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}>
              <input type="checkbox" checked={bodyMetrics.priorTurp} onChange={e=>setBodyMetrics({...bodyMetrics,priorTurp:e.target.checked})} style={{width:18,height:18,accentColor:"#2563eb"}}/>
              <span>Prior prostate procedure (TURP, HoLEP, Rezum, Urolift, etc.)</span>
            </label>
          </div>
        </Card>

        <div style={{display:"flex",justifyContent:"space-between",marginTop:32}}>
          <button style={btnS} onClick={()=>setStep(1)}>← Back</button>
          <button style={btnP} onClick={()=>setStep(3)}>Continue →</button>
        </div>
      </div>
    );
  }

  // ==== STEP 3: PRIORITIES ====
  if(step===3){return(
    <div style={cs}><ProgressBar step={3} total={STEPS.length}/>
      <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>What Matters Most to You?</h2>
      <p style={{color:"#64748b",fontSize:14,marginBottom:24}}>Move each slider to reflect how important each factor is.</p>
      <Card style={{marginBottom:16,padding:24}}>
        <Slider label="Avoiding treatment side effects" value={priorities.avoidSideEffects} onChange={v=>setPriorities({...priorities,avoidSideEffects:v})} leftLabel="Less important" rightLabel="Very important"/>
        <Slider label="Maximum certainty of cancer cure" value={priorities.certaintyOfCure} onChange={v=>setPriorities({...priorities,certaintyOfCure:v})} leftLabel="Less important" rightLabel="Very important"/>
        <Slider label="Minimizing recovery time" value={priorities.minimizeRecovery} onChange={v=>setPriorities({...priorities,minimizeRecovery:v})} leftLabel="Less important" rightLabel="Very important"/>
        <Slider label="Preserving sexual function" value={priorities.preserveErections} onChange={v=>setPriorities({...priorities,preserveErections:v})} leftLabel="Less important" rightLabel="Very important"/>
        <Slider label="Avoiding ongoing monitoring" value={priorities.avoidOngoing} onChange={v=>setPriorities({...priorities,avoidOngoing:v})} leftLabel="Less important" rightLabel="Very important"/>
        <Slider label="Preserving bowel function" value={priorities.preserveBowel} onChange={v=>setPriorities({...priorities,preserveBowel:v})} leftLabel="Less important" rightLabel="Very important"/>
      </Card>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:32}}>
        <button style={btnS} onClick={()=>setStep(2)}>← Back</button>
        <button style={btnP} onClick={()=>setStep(4)}>See My Results →</button>
      </div>
    </div>
  );}

  // ==== STEP 4: TREATMENT GUIDE ====
  if(step===4){
    const maxScore=rankedTreatments[0]?.score||1;
    return(
      <div style={cs}><ProgressBar step={4} total={STEPS.length}/>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Your Personalized Treatment Guide</h2>
        <p style={{color:"#64748b",fontSize:14,marginBottom:8}}>Ranked by your priorities. Tap any treatment to expand.</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
          {risk&&<span style={{padding:"4px 14px",borderRadius:20,background:`${riskColors[risk]}20`,color:riskColors[risk],fontWeight:700,fontSize:13}}>{risk} Risk</span>}
          {ipssTotal!==null&&<span style={{padding:"4px 14px",borderRadius:20,background:"#f5f3ff",color:"#7c3aed",fontWeight:600,fontSize:12}}>IPSS {ipssTotal}</span>}
          {shimTotal!==null&&<span style={{padding:"4px 14px",borderRadius:20,background:"#eff6ff",color:"#2563eb",fontWeight:600,fontSize:12}}>SHIM {shimTotal}</span>}
          {bmi&&<span style={{padding:"4px 14px",borderRadius:20,background:"#f0fdf4",color:"#059669",fontWeight:600,fontSize:12}}>BMI {bmi}</span>}
        </div>
        {rankedTreatments.map((t,i)=>{
          const pct=Math.round((t.score/maxScore)*100);
          const isExp=expandedTreatment===t.key;
          const pred=predictions;
          const predKey=t.key==="activeSurveillance"?"monitoring":t.key==="focalTherapy"?null:t.key;
          return(
            <Card key={t.key} style={{marginBottom:12,cursor:"pointer"}} onClick={()=>setExpandedTreatment(isExp?null:t.key)}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                {i===0&&<span style={{background:"#dbeafe",color:"#2563eb",fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:12}}>BEST MATCH</span>}
                <span style={{fontSize:24}}>{t.icon}</span>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:17}}>{t.name}</div><div style={{fontSize:13,color:"#64748b"}}>{t.shortDesc}</div></div>
                <div style={{fontSize:13,color:"#64748b"}}>{isExp?"▲":"▼"}</div>
              </div>
              <div style={{background:"#f1f5f9",borderRadius:6,height:10,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:t.color,borderRadius:6,transition:"width 0.5s"}}/></div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>Match: {pct}%</div>
              {isExp&&t.details&&(
                <div style={{marginTop:16,borderTop:"1px solid #e2e8f0",paddingTop:16}} onClick={e=>e.stopPropagation()}>
                  <div style={{fontSize:14,marginBottom:12}}>{t.details.approach}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                    <div style={{background:"#f8fafc",borderRadius:8,padding:12}}><div style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>10-YEAR SURVIVAL</div><div style={{fontWeight:700}}>{t.details.tenYearSurvival}</div></div>
                    <div style={{background:"#f8fafc",borderRadius:8,padding:12}}><div style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>RECOVERY</div><div style={{fontWeight:700,fontSize:13}}>{t.details.recovery}</div></div>
                  </div>
                  {/* Personalized predictions */}
                  {predKey&&pred[predKey]&&(
                    <div style={{background:"#fefce8",border:"1px solid #fef08a",borderRadius:10,padding:16,marginBottom:16}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                        <span style={{background:"#ca8a04",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8}}>YOUR PREDICTED OUTCOMES</span>
                        <span style={{fontSize:11,color:"#a16207"}}>Adjusted for your IPSS, SHIM, BMI, and age</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                        <div style={{background:"#fff",borderRadius:8,padding:10,border:"1px solid #fef08a"}}>
                          <div style={{fontSize:11,color:"#a16207",fontWeight:600}}>ERECTIONS AT 2 YR</div>
                          <div style={{fontSize:22,fontWeight:800,color:"#854d0e"}}>{pred[predKey].erection.twoYr}%</div>
                        </div>
                        <div style={{background:"#fff",borderRadius:8,padding:10,border:"1px solid #fef08a"}}>
                          <div style={{fontSize:11,color:"#a16207",fontWeight:600}}>ERECTIONS AT 6 YR</div>
                          <div style={{fontSize:22,fontWeight:800,color:"#854d0e"}}>{pred[predKey].erection.sixYr}%</div>
                        </div>
                        <div style={{background:"#fff",borderRadius:8,padding:10,border:"1px solid #fef08a"}}>
                          <div style={{fontSize:11,color:"#a16207",fontWeight:600}}>PAD USE AT 1 YR</div>
                          <div style={{fontSize:22,fontWeight:800,color:"#854d0e"}}>{pred[predKey].pads.oneYr}%</div>
                        </div>
                        <div style={{background:"#fff",borderRadius:8,padding:10,border:"1px solid #fef08a"}}>
                          <div style={{fontSize:11,color:"#a16207",fontWeight:600}}>NOCTURIA AT 6 YR</div>
                          <div style={{fontSize:22,fontWeight:800,color:"#854d0e"}}>{pred[predKey].nocturia.sixYr}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {t.key==="focalTherapy"&&t.details.focalTrialData&&(
                    <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:16,marginBottom:16}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                        <span style={{background:"#059669",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:8}}>FOCAL THERAPY EVIDENCE</span>
                      </div>

                      {/* HEAT Registry */}
                      <div style={{background:"#fff",border:"1px solid #d1fae5",borderRadius:8,padding:12,marginBottom:10}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#065f46",marginBottom:4}}>HEAT Registry — {t.details.focalTrialData.heat.n.toLocaleString()} patients, focal HIFU</div>
                        <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>{t.details.focalTrialData.heat.design}</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                          <div style={{background:"#f0fdf4",borderRadius:6,padding:8,textAlign:"center"}}>
                            <div style={{fontSize:18,fontWeight:800,color:"#059669"}}>{t.details.focalTrialData.heat.ffs7yr.all}%</div>
                            <div style={{fontSize:10,color:"#64748b"}}>7-yr Failure-Free</div>
                          </div>
                          <div style={{background:"#f0fdf4",borderRadius:6,padding:8,textAlign:"center"}}>
                            <div style={{fontSize:18,fontWeight:800,color:"#059669"}}>100%</div>
                            <div style={{fontSize:10,color:"#64748b"}}>7-yr Mets-Free</div>
                          </div>
                          <div style={{background:"#f0fdf4",borderRadius:6,padding:8,textAlign:"center"}}>
                            <div style={{fontSize:18,fontWeight:800,color:"#059669"}}>{t.details.focalTrialData.heat.salvageFree7yr}%</div>
                            <div style={{fontSize:10,color:"#64748b"}}>7-yr Salvage-Free</div>
                          </div>
                        </div>
                        <div style={{fontSize:11,color:"#64748b",marginTop:6}}>By D'Amico risk: Low {t.details.focalTrialData.heat.ffs7yr.low}% | Intermediate {t.details.focalTrialData.heat.ffs7yr.intermediate}% | High {t.details.focalTrialData.heat.ffs7yr.high}% FFS at 7 yr. ~{t.details.focalTrialData.heat.retreatmentRate}% needed repeat focal; ~{t.details.focalTrialData.heat.salvageWholeGland}% needed salvage whole-gland Tx.</div>
                      </div>

                      {/* HIFI Trial */}
                      <div style={{background:"#fff",border:"1px solid #d1fae5",borderRadius:8,padding:12,marginBottom:10}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#065f46",marginBottom:4}}>HIFI Trial — {t.details.focalTrialData.hifi.n.toLocaleString()} patients, HIFU vs Surgery</div>
                        <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>{t.details.focalTrialData.hifi.design}</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                          <div style={{background:"#f0fdf4",borderRadius:6,padding:8,textAlign:"center"}}>
                            <div style={{fontSize:16,fontWeight:800,color:"#059669"}}>90% vs 86%</div>
                            <div style={{fontSize:10,color:"#64748b"}}>30-mo Salvage-Free (HIFU vs RP)</div>
                          </div>
                          <div style={{background:"#f0fdf4",borderRadius:6,padding:8,textAlign:"center"}}>
                            <div style={{fontSize:16,fontWeight:800,color:"#059669"}}>Noninferior</div>
                            <div style={{fontSize:10,color:"#64748b"}}>{t.details.focalTrialData.hifi.noninferiority}</div>
                          </div>
                        </div>
                        <div style={{fontSize:11,color:"#64748b",marginTop:6}}>{t.details.focalTrialData.hifi.continence12mo}. IIEF-5: {t.details.focalTrialData.hifi.iief5drop}. {t.details.focalTrialData.hifi.metastasis}.</div>
                      </div>

                      {/* IRE-IMMUNO */}
                      <div style={{background:"#fff",border:"1px solid #d1fae5",borderRadius:8,padding:12,marginBottom:10}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#065f46",marginBottom:4}}>IRE-IMMUNO Study — {t.details.focalTrialData.ireImmuno.n} patients, IRE vs RARP</div>
                        <div style={{fontSize:12,color:"#64748b",marginBottom:4}}>{t.details.focalTrialData.ireImmuno.design}</div>
                        <div style={{fontSize:12,color:"#065f46"}}>{t.details.focalTrialData.ireImmuno.finding}</div>
                      </div>

                      {/* Critical caveat */}
                      <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:12,marginTop:4}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#991b1b",marginBottom:4}}>IMPORTANT: Long-Term Evidence Gap</div>
                        <div style={{fontSize:12,color:"#991b1b",lineHeight:1.6}}>
                          No randomized trial comparing focal therapy to surgery or radiation exists with 10+ year follow-up. The HEAT Registry's median follow-up is 32 months (7-year data available for only 24% of the cohort). The HIFI Trial has only 30 months of follow-up and was non-randomized with significant age differences between groups. The IRE-IMMUNO study is exploratory (n=30). While medium-term outcomes are encouraging, the long-term cancer control equivalence to definitive whole-gland treatment remains unproven. Patients choosing focal therapy should commit to rigorous long-term surveillance with PSA, MRI, and protocol biopsies.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Oncologic outcomes by grade group */}
                  {clinical.gleason && ONCOLOGIC_BY_GRADE[clinical.gleason] && t.key !== "focalTherapy" && (
                    <div style={{background:"#fff",border:"1px solid #fecaca",borderRadius:10,padding:16,marginBottom:16}}>
                      <GradeGroupOutcomes gleason={clinical.gleason} />
                    </div>
                  )}

                  <h4 style={{fontSize:14,fontWeight:700,marginBottom:8,color:"#475569"}}>Key Considerations</h4>
                  <ul style={{margin:0,paddingLeft:20,fontSize:13,color:"#475569"}}>{t.details.considerations.map((c,ci)=><li key={ci} style={{marginBottom:4}}>{c}</li>)}</ul>
                </div>
              )}
            </Card>
          );
        })}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:32}}>
          <button style={btnS} onClick={()=>setStep(3)}>← Priorities</button>
          <button style={btnP} onClick={()=>setStep(5)}>See Predicted Outcomes →</button>
        </div>
      </div>
    );
  }

  // ==== STEP 5: PERSONALIZED PREDICTED OUTCOMES ====
  if(step===5){
    const p=predictions;
    const f=p.factors;
    return(
      <div style={cs}><ProgressBar step={5} total={STEPS.length}/>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Your Predicted Functional Outcomes</h2>
        <p style={{color:"#64748b",fontSize:14,marginBottom:8}}>Adjusted from ProtecT population data based on YOUR baseline scores.</p>

        {/* Factor summary */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
          <span style={{padding:"4px 12px",borderRadius:16,background:"#f5f3ff",fontSize:12,color:"#7c3aed",fontWeight:600}}>SHIM: {f.shimCategory}</span>
          <span style={{padding:"4px 12px",borderRadius:16,background:"#eff6ff",fontSize:12,color:"#2563eb",fontWeight:600}}>IPSS: {f.ipssCategory}</span>
          <span style={{padding:"4px 12px",borderRadius:16,background:"#f0fdf4",fontSize:12,color:"#059669",fontWeight:600}}>BMI: {f.bmiCategory}</span>
          <span style={{padding:"4px 12px",borderRadius:16,background:"#fef3c7",fontSize:12,color:"#b45309",fontWeight:600}}>Age: {clinical.age||"62"}</span>
          {bodyMetrics.diabetes&&<span style={{padding:"4px 12px",borderRadius:16,background:"#fef2f2",fontSize:12,color:"#dc2626",fontWeight:600}}>Diabetes</span>}
          {bodyMetrics.priorTurp&&<span style={{padding:"4px 12px",borderRadius:16,background:"#fef2f2",fontSize:12,color:"#dc2626",fontWeight:600}}>Prior TURP</span>}
        </div>

        {/* Erection predictions */}
        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:4,color:"#475569"}}>Predicted Erectile Function</h3>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:12}}>% chance of erections firm enough for intercourse</div>
          <PredictionRow label="At 6 Months" timeLabel="Early recovery period" surgery={p.surgery.erection.sixMo} radiation={p.radiation.erection.sixMo} monitoring={p.monitoring.erection.sixMo}/>
          <PredictionRow label="At 2 Years" timeLabel="Peak recovery" surgery={p.surgery.erection.twoYr} radiation={p.radiation.erection.twoYr} monitoring={p.monitoring.erection.twoYr}/>
          <PredictionRow label="At 6 Years" timeLabel="Long-term" surgery={p.surgery.erection.sixYr} radiation={p.radiation.erection.sixYr} monitoring={p.monitoring.erection.sixYr}/>
        </Card>

        {/* Continence predictions */}
        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:4,color:"#475569"}}>Predicted Urinary Pad Use</h3>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:12}}>% likelihood of needing absorbent pads (lower is better)</div>
          <PredictionRow label="At 6 Months" timeLabel="Early recovery" surgery={p.surgery.pads.sixMo} radiation={p.radiation.pads.sixMo} monitoring={p.monitoring.pads.sixMo}/>
          <PredictionRow label="At 1 Year" timeLabel="Intermediate" surgery={p.surgery.pads.oneYr} radiation={p.radiation.pads.oneYr} monitoring={p.monitoring.pads.oneYr}/>
          <PredictionRow label="At 6 Years" timeLabel="Long-term" surgery={p.surgery.pads.sixYr} radiation={p.radiation.pads.sixYr} monitoring={p.monitoring.pads.sixYr}/>
        </Card>

        {/* Nocturia predictions */}
        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:4,color:"#475569"}}>Predicted Nocturia (≥2x/Night)</h3>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:12}}>% experiencing significant nocturia (lower is better)</div>
          <PredictionRow label="At 6 Months" timeLabel="" surgery={p.surgery.nocturia.sixMo} radiation={p.radiation.nocturia.sixMo} monitoring={p.monitoring.nocturia.sixMo}/>
          <PredictionRow label="At 6 Years" timeLabel="" surgery={p.surgery.nocturia.sixYr} radiation={p.radiation.nocturia.sixYr} monitoring={p.monitoring.nocturia.sixYr}/>
        </Card>

        {/* Bowel predictions */}
        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:4,color:"#475569"}}>Predicted Bowel (Fecal Leakage)</h3>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:12}}>% experiencing fecal leakage (lower is better)</div>
          <PredictionRow label="At 6 Years" timeLabel="" surgery={p.surgery.bowel.sixYr} radiation={p.radiation.bowel.sixYr} monitoring={p.monitoring.bowel.sixYr}/>
        </Card>

        <div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:14,fontSize:12,color:"#92400e",marginBottom:16}}>
          <strong>How these predictions are generated:</strong> ProtecT population-level rates are adjusted using published predictive factors including baseline SHIM score (strongest predictor of erectile recovery), IPSS (predicts voiding outcomes), age, BMI, diabetes, and prior prostate procedures. These are estimates — individual outcomes vary. Discuss with your surgeon or radiation oncologist for institution-specific data.
        </div>

        <div style={{display:"flex",justifyContent:"space-between",marginTop:32}}>
          <button style={btnS} onClick={()=>setStep(4)}>← Treatment Guide</button>
          <button style={btnP} onClick={()=>setStep(6)}>ProtecT Population Data →</button>
        </div>
      </div>
    );
  }

  // ==== STEP 6: ProtecT POPULATION DATA ====
  if(step===6){
    const oKeys=Object.keys(PROTECT_DATA);
    const cur=PROTECT_DATA[activeOutcome];
    return(
      <div style={cs}><ProgressBar step={6} total={STEPS.length}/>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>ProtecT Trial: Population-Level Outcomes</h2>
        <p style={{color:"#64748b",fontSize:14,marginBottom:4}}>What 1,643 men reported over 12 years (before individual adjustment).</p>
        <div style={{fontSize:12,color:"#94a3b8",marginBottom:20}}>Donovan et al. <em>NEJM</em> 2016 &amp; <em>NEJM Evidence</em> 2023</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
          {oKeys.map(k=><button key={k} onClick={()=>setActiveOutcome(k)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",border:activeOutcome===k?"none":"1px solid #e2e8f0",background:activeOutcome===k?"#2563eb":"#fff",color:activeOutcome===k?"#fff":"#64748b"}}>{PROTECT_DATA[k].title.length>25?PROTECT_DATA[k].title.split("(")[0].trim():PROTECT_DATA[k].title}</button>)}
        </div>
        <Card style={{marginBottom:16,padding:20}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>{cur.title}</h3>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:16}}>{cur.yLabel}</div>
          <OutcomeChart data={cur}/>
        </Card>
        <Card style={{marginBottom:16,background:"#fefce8",border:"1px solid #fef08a"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#854d0e",marginBottom:4}}>What this means</div>
          <div style={{fontSize:14,color:"#713f12",lineHeight:1.6}}>{cur.insight}</div>
        </Card>
        {/* ProtecT 15-Year Cancer Outcomes */}
        <Card style={{marginBottom:16}}>
          <CancerControlSummary />
        </Card>

        {/* Grade-specific oncologic outcomes */}
        {clinical.gleason && ONCOLOGIC_BY_GRADE[clinical.gleason] && (
          <Card style={{marginBottom:16}}>
            <GradeGroupOutcomes gleason={clinical.gleason} />
          </Card>
        )}

        <Card style={{marginBottom:16,background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#166534",marginBottom:4}}>Key Cancer Control Takeaways</div>
          <div style={{fontSize:13,color:"#166534",lineHeight:1.7}}>
            <p style={{marginBottom:8}}><strong>Mortality is very low:</strong> Prostate cancer death was ~3% across all ProtecT groups at 15 years with no significant difference between treatments.</p>
            <p style={{marginBottom:8}}><strong>Metastasis and progression differ:</strong> Active monitoring had ~2x the metastasis rate (9.4% vs ~5%) and ~2.5x the clinical progression rate vs radical treatment.</p>
            <p style={{marginBottom:8}}><strong>Grade Group matters:</strong> Higher Grade Groups have progressively more BCR, salvage treatment, and metastasis. GG1 has excellent outcomes with any approach; GG4-5 require definitive multimodal treatment.</p>
            <p style={{marginBottom:0}}><strong>Salvage RT is effective:</strong> GETUG-AFU 17 and RAVES showed early salvage radiation achieves similar cancer control to adjuvant RT — sparing ~50% of men from radiation.</p>
          </div>
        </Card>

        <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:14,fontSize:11,color:"#0c4a6e",marginBottom:16}}>
          <strong>References:</strong> Hamdy FC et al. <em>NEJM</em> 2023;388:1547-58 (DOI: 10.1056/NEJMoa2214122) | Donovan JL et al. <em>NEJM</em> 2016;375:1425-37 (DOI: 10.1056/NEJMoa1606221) | Donovan JL et al. <em>NEJM Evid</em> 2023;2(4) (DOI: 10.1056/EVIDoa2300018) | Sargos P et al. <em>Lancet Oncol</em> 2020;21:1341-52 | Kneebone A et al. <em>Lancet Oncol</em> 2020;21:1331-40
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:32}}>
          <button style={btnS} onClick={()=>setStep(5)}>← Predicted Outcomes</button>
          <button style={btnP} onClick={()=>setStep(7)}>View Summary →</button>
        </div>
      </div>
    );
  }

  // ==== STEP 7: SUMMARY ====
  if(step===7){
    const p=predictions;
    return(
      <div style={cs}><ProgressBar step={7} total={STEPS.length}/>
        <h2 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Your Complete Decision Summary</h2>
        <p style={{color:"#64748b",fontSize:14,marginBottom:24}}>Bring this to your next appointment.</p>

        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:12,color:"#475569"}}>Cancer Profile</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:14}}>
            <div><span style={{color:"#94a3b8"}}>PSA:</span> {clinical.psa} ng/mL</div>
            <div><span style={{color:"#94a3b8"}}>Gleason:</span> {clinical.gleason}</div>
            <div><span style={{color:"#94a3b8"}}>Stage:</span> {clinical.stage}</div>
            <div><span style={{color:"#94a3b8"}}>Age:</span> {clinical.age}</div>
            <div><span style={{color:"#94a3b8"}}>Cores:</span> {clinical.positiveCores||"—"}/{clinical.totalCores||"—"}</div>
            <div><span style={{color:"#94a3b8"}}>Risk:</span> <span style={{fontWeight:700,color:riskColors[risk]||"#1e293b"}}>{risk||"—"}</span></div>
          </div>
        </Card>

        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:12,color:"#475569"}}>Baseline Function Scores</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div style={{textAlign:"center",background:"#f8fafc",borderRadius:8,padding:10}}>
              <div style={{fontSize:22,fontWeight:800,color:"#7c3aed"}}>{ipssTotal!==null?ipssTotal:"—"}</div>
              <div style={{fontSize:11,color:"#64748b"}}>IPSS (/35)</div>
              <div style={{fontSize:11,color:"#94a3b8"}}>{ipssTotal===null?"—":ipssTotal<=7?"Mild":ipssTotal<=19?"Moderate":"Severe"}</div>
            </div>
            <div style={{textAlign:"center",background:"#f8fafc",borderRadius:8,padding:10}}>
              <div style={{fontSize:22,fontWeight:800,color:"#2563eb"}}>{shimTotal!==null?shimTotal:"—"}</div>
              <div style={{fontSize:11,color:"#64748b"}}>SHIM (/25)</div>
              <div style={{fontSize:11,color:"#94a3b8"}}>{p.factors.shimCategory}</div>
            </div>
            <div style={{textAlign:"center",background:"#f8fafc",borderRadius:8,padding:10}}>
              <div style={{fontSize:22,fontWeight:800,color:"#059669"}}>{bmi||"—"}</div>
              <div style={{fontSize:11,color:"#64748b"}}>BMI</div>
              <div style={{fontSize:11,color:"#94a3b8"}}>{p.factors.bmiCategory}</div>
            </div>
          </div>
        </Card>

        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:12,color:"#475569"}}>Treatment Ranking</h3>
          {rankedTreatments.map((t,i)=>(
            <div key={t.key} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:i<rankedTreatments.length-1?"1px solid #f1f5f9":"none"}}>
              <span style={{width:28,height:28,borderRadius:14,background:i===0?"#2563eb":"#e2e8f0",color:i===0?"#fff":"#64748b",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0}}>{i+1}</span>
              <span style={{fontSize:20}}>{t.icon}</span>
              <span style={{fontWeight:600}}>{t.name}</span>
              {i===0&&<span style={{background:"#dbeafe",color:"#2563eb",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,marginLeft:"auto"}}>BEST MATCH</span>}
            </div>
          ))}
        </Card>

        <Card style={{marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:12,color:"#475569"}}>Your Predicted Outcomes at 2 Years</h3>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:"2px solid #e2e8f0"}}>
                <th style={{textAlign:"left",padding:"8px 6px",color:"#64748b"}}>Outcome</th>
                <th style={{textAlign:"center",padding:"8px 6px",color:"#3b82f6"}}>Monitoring</th>
                <th style={{textAlign:"center",padding:"8px 6px",color:"#8b5cf6"}}>Surgery</th>
                <th style={{textAlign:"center",padding:"8px 6px",color:"#f59e0b"}}>Radiation</th>
              </tr></thead>
              <tbody>
                {[
                  ["Erections for intercourse",`${p.monitoring.erection.twoYr}%`,`${p.surgery.erection.twoYr}%`,`${p.radiation.erection.twoYr}%`],
                  ["Pad use",`${p.monitoring.pads.oneYr}%`,`${p.surgery.pads.oneYr}%`,`${p.radiation.pads.oneYr}%`],
                  ["Nocturia ≥2x/night",`${p.monitoring.nocturia.oneYr}%`,`${p.surgery.nocturia.oneYr}%`,`${p.radiation.nocturia.oneYr}%`],
                  ["Fecal leakage",`${p.monitoring.bowel.sixYr}%`,`${p.surgery.bowel.sixYr}%`,`${p.radiation.bowel.sixYr}%`],
                ].map(([label,...vals],ri)=>(
                  <tr key={ri} style={{borderBottom:"1px solid #f1f5f9"}}>
                    <td style={{padding:"8px 6px",fontWeight:500}}>{label}</td>
                    {vals.map((v,ci)=><td key={ci} style={{textAlign:"center",padding:"8px 6px",fontWeight:600}}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{fontSize:11,color:"#94a3b8",marginTop:8}}>Adjusted for IPSS {ipssTotal||"—"}, SHIM {shimTotal||"—"}, BMI {bmi||"—"}, Age {clinical.age||"—"}</div>
        </Card>

        {/* Grade-specific cancer control in summary */}
        {clinical.gleason && ONCOLOGIC_BY_GRADE[clinical.gleason] && (
          <Card style={{marginBottom:16}}>
            <GradeGroupOutcomes gleason={clinical.gleason} />
          </Card>
        )}

        <Card style={{marginBottom:16,background:"#f0fdf4",border:"1px solid #bbf7d0"}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:8,color:"#166534"}}>Questions to Ask Your Doctor</h3>
          <ul style={{margin:0,paddingLeft:20,fontSize:14,color:"#166534"}}>
            <li style={{marginBottom:6}}>Given my IPSS of {ipssTotal||"—"} and SHIM of {shimTotal||"—"}, how do you expect my function to change with each treatment?</li>
            <li style={{marginBottom:6}}>How do the ProtecT outcomes compare with your institutional results using modern techniques?</li>
            <li style={{marginBottom:6}}>Would genomic testing (Decipher, Oncotype, Prolaris) change my management?</li>
            <li style={{marginBottom:6}}>If I choose active surveillance, what triggers treatment?</li>
            <li style={{marginBottom:6}}>Am I a candidate for focal therapy based on my MRI?</li>
            <li style={{marginBottom:6}}>For radiation — would I need ADT, and for how long?</li>
            <li style={{marginBottom:6}}>For surgery — do you offer nerve-sparing? What is your continence rate at 12 months?</li>
            <li>What prehabilitation (pelvic floor therapy) do you recommend before treatment?</li>
          </ul>
        </Card>

        <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:14,fontSize:11,color:"#0c4a6e",marginBottom:12}}>
          <strong>References:</strong> Donovan JL et al. <em>NEJM</em> 2016;375:1425-1437 (DOI: 10.1056/NEJMoa1606221) | Donovan JL et al. <em>NEJM Evidence</em> 2023;2(4):EVIDoa2300018 (DOI: 10.1056/EVIDoa2300018)
        </div>
        <div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:14,fontSize:12,color:"#92400e",marginBottom:20}}>
          Predictions are estimates based on published literature adjustments. Individual outcomes vary. This is a shared decision-making tool — not a substitute for personalized clinical consultation.
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:32}}>
          <button style={btnS} onClick={()=>setStep(6)}>← Back</button>
          <button style={btnS} onClick={()=>setStep(0)}>Start Over</button>
        </div>
      </div>
    );
  }
  return null;
}
