import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { $1, Coffee } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import emailjs from "@emailjs/browser";

export default function DelmoccaTool() {
  const [started, setStarted] = useState(false);
  const [inputs, setInputs] = useState({
    machine: '',
    grinder1: '',
    grinder2: '',
    advertising: '',
    consumptionKg: '',
    pricePerKg: '',
    coffeeCost: '13.5',
  });

  const [showAnnual, setShowAnnual] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState([]);
  const pdfRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteLogEntry = (index) => {
    setLog((prev) => prev.filter((_, i) => i !== index));
  };

  const parse = (val) => parseFloat(val) || 0;

  const fixedCosts =
    parse(inputs.machine) + parse(inputs.grinder1) + parse(inputs.grinder2) + parse(inputs.advertising);
  const profitPerKg = parse(inputs.pricePerKg) - parse(inputs.coffeeCost);
  const profitPerMonth = profitPerKg * parse(inputs.consumptionKg);
  const profitPerYear = profitPerMonth * 12;
  const revenuePerMonth = parse(inputs.pricePerKg) * parse(inputs.consumptionKg);
  const revenuePerYear = revenuePerMonth * 12;
  const margin = parse(inputs.pricePerKg) > 0 ? profitPerKg / parse(inputs.pricePerKg) : 0;
  const paybackMonths = profitPerMonth > 0 ? fixedCosts / profitPerMonth : 0;

  const recommendation = paybackMonths > 0
    ? paybackMonths < 8
      ? { text: "DO IT", color: "text-green-800 bg-amber-100 border-green-800", icon: <CheckCircle className="inline mr-2" /> }
      : { text: "DO NOT", color: "text-white bg-[#6F4E37] border-[#6F4E37]", icon: <XCircle className="inline mr-2" /> }
    : null;

  const sendAsPDF = async () => {
    if (!email) return alert("Please enter an email address.");
    setSending(true);
    try {
      const canvas = await html2canvas(pdfRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output("blob");

      const formData = new FormData();
      formData.append("service_id", "service_vxrjzsh");
      formData.append("template_id", "template_m26wjnr");
      formData.append("user_id", "I3jJW4Um7f9kANtpX");
      formData.append("to_email", email);
      formData.append("message", "Sales Offer PDF attached");
      formData.append("attachment", new File([pdfBlob], "sales-offer.pdf"));

      await fetch("https://api.emailjs.com/api/v1.0/email/send-form", {
        method: "POST",
        body: formData,
      });

      const timestamp = new Date().toLocaleString();
      setLog((prev) => [...prev, { email, timestamp }]);
      alert("Email sent!");
    } catch (error) {
      alert("Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#3C2F2F] text-white p-6">
        <Coffee className="w-24 h-24 mb-6 cursor-pointer text-white hover:text-[#F5F5DC] hover:animate-bounce transition-all duration-300" onClick={() => setStarted(true)} />
        <h1 className="text-3xl font-bold text-center">Καλώς ήρθατε στην Delmocca</h1>
        <p className="mt-2 text-center max-w-md">Ξεκίνα τη δημιουργία προσφοράς για τον πελάτη σου πατώντας το λογότυπο.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-4 max-w-xl mx-auto bg-[#F5F5DC] text-[#3C2F2F] rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-[#3C2F2F]">DelmoccaTool</h1>
      <Button onClick={() => setShowAnnual((prev) => !prev)} className="bg-[#6F4E37] text-white hover:bg-[#3C2F2F]">
        {showAnnual ? "Show Monthly" : "Show Annual"}
      </Button>

      {[
        { label: "Machine (€)", name: "machine" },
        { label: "Grinder 1 (€)", name: "grinder1" },
        { label: "Grinder 2 (€)", name: "grinder2" },
        { label: "Advertising (€)", name: "advertising" },
        { label: "Consumption (kg/month)", name: "consumptionKg" },
        { label: "Price per kg (€)", name: "pricePerKg" },
        { label: "Coffee cost (€)", name: "coffeeCost" },
      ].map(({ label, name }) => (
        <div key={name}>
          <Label htmlFor={name} className="text-[#3C2F2F]">{label}</Label>
          <Input
            id={name}
            name={name}
            type="number"
            value={inputs[name]}
            onChange={handleChange}
            className="mt-1"
            inputMode="decimal"
            pattern="[0-9]*"
          />
          <p className="text-sm text-red-600 mt-1">
            {label.includes('€') ? 'Δώσε τιμή €' : 'Δώσε τιμή'}
          </p>
        </div>
      ))}

      <div>
        <Label htmlFor="email" className="text-[#3C2F2F]">Recipient Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
        />
      </div>

      <div ref={pdfRef}>
        <Card className="bg-white border-[#6F4E37]">
          <CardContent className="space-y-2 p-4">
            <p><strong>Fixed Costs:</strong> €{fixedCosts.toFixed(2)}</p>
            <p><strong>Profit/kg:</strong> €{profitPerKg.toFixed(2)}</p>
            {showAnnual ? (
              <>
                <p><strong>Annual Profit:</strong> €{profitPerYear.toFixed(2)}</p>
                <p><strong>Annual Revenue:</strong> €{revenuePerYear.toFixed(2)}</p>
              </>
            ) : (
              <>
                <p><strong>Monthly Profit:</strong> €{profitPerMonth.toFixed(2)}</p>
                <p><strong>Monthly Revenue:</strong> €{revenuePerMonth.toFixed(2)}</p>
              </>
            )}
            <p><strong>Margin:</strong> {(margin * 100).toFixed(2)}%</p>
            <p><strong>Payback Period:</strong> {paybackMonths.toFixed(1)} months</p>
          </CardContent>
        </Card>

        {recommendation && (
          <div className={`rounded-xl p-4 mt-4 text-center shadow border font-bold text-2xl ${recommendation.color}`}>
            {recommendation.icon}{recommendation.text}
          </div>
        )}
      </div>

      <Button className="mt-4 bg-[#6F4E37] text-white hover:bg-[#3C2F2F]" onClick={sendAsPDF} disabled={sending}>
        {sending ? <Loader2 className="animate-spin mr-2 inline" /> : null}
        {sending ? "Sending..." : "Send as PDF"}
      </Button>

      {log.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Sent Email Log</h2>
          <ul className="text-sm mt-2 space-y-1">
            {log.map((entry, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>{entry.timestamp} → <strong>{entry.email}</strong></span>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteLogEntry(index)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}</div>
  );
}

