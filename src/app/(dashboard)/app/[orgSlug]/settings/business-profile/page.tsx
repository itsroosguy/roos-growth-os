"use client";

import React, { useState } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { businessContextStore } from "@/lib/ai/business-context-store";
import { FAQItem } from "@/lib/ai/types";
import {
  Building2,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  Clock,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function BusinessProfileSettingsPage() {
  const { currentOrg, isAdmin } = useTenant();
  const profile = businessContextStore.getProfile(currentOrg.slug);

  const [businessName, setBusinessName] = useState(profile.business_name);
  const [description, setDescription] = useState(profile.description);
  const [products, setProducts] = useState(profile.products_services);
  const [hours, setHours] = useState(profile.operating_hours);
  const [serviceArea, setServiceArea] = useState(profile.service_area);
  const [email, setEmail] = useState(profile.contact_email);
  const [phone, setPhone] = useState(profile.contact_phone);
  const [pricing, setPricing] = useState(profile.pricing_info);
  const [returnPolicy, setReturnPolicy] = useState(profile.return_policy);
  const [faqs, setFaqs] = useState<FAQItem[]>(profile.faqs || []);
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    businessContextStore.updateProfile(currentOrg.slug, {
      business_name: businessName,
      description,
      products_services: products,
      operating_hours: hours,
      service_area: serviceArea,
      contact_email: email,
      contact_phone: phone,
      pricing_info: pricing,
      return_policy: returnPolicy,
      faqs,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    const item: FAQItem = {
      id: `faq-${Date.now()}`,
      question: newFaqQuestion.trim(),
      answer: newFaqAnswer.trim(),
    };
    setFaqs([...faqs, item]);
    setNewFaqQuestion("");
    setNewFaqAnswer("");
  };

  const handleRemoveFaq = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E2D8]">
        <div>
          <h1 className="text-[2.25rem] font-medium leading-[1.15] text-[#12141A] tracking-[-0.02em]">
            Business Knowledge Profile
          </h1>
          <p className="type-body text-[#454B57] mt-1">
            Verified company facts, approved pricing, and FAQs used to ground AI responses for {currentOrg.name}.
          </p>
        </div>

        <Link href={`/app/${currentOrg.slug}/settings/ai`}>
          <Button variant="outline" className="h-10 px-4 text-[14px] font-medium rounded-[12px] border-[#E6E2D8] bg-white hover:bg-[#F7F5F0] text-[#12141A] shadow-xs cursor-pointer">
            Back to AI Settings
          </Button>
        </Link>
      </div>

      {saved && (
        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">Business knowledge profile saved and active for AI grounding!</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="border border-[#E5E5E7] bg-white rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E5E5E7]">
            <Building2 className="h-5 w-5 text-[#FF7A1A]" />
            <h2 className="text-base font-semibold text-[#0D0D0E]">Company Identity &amp; Services</h2>
          </div>
          <p className="text-xs text-[#8E8E93] font-medium">
            These approved facts are injected into system prompts so the AI never invents company policies or unapproved products.
          </p>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Registered Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7A1A] text-[#0D0D0E] rounded-xl text-xs"
              />
              <Input
                label="Service Area / Geographical Coverage"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                required
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7A1A] text-[#0D0D0E] rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#0D0D0E] mb-1">
                Company Overview &amp; Value Proposition
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] p-2.5 text-xs text-[#0D0D0E] font-medium focus:outline-none focus:bg-white focus:border-[#FF7A1A]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#0D0D0E] mb-1">
                Products &amp; Commercial Offerings
              </label>
              <textarea
                rows={2}
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] p-2.5 text-xs text-[#0D0D0E] font-medium focus:outline-none focus:bg-white focus:border-[#FF7A1A]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Operating Hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7A1A] text-[#0D0D0E] rounded-xl text-xs"
              />
              <Input
                label="Official Contact Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7A1A] text-[#0D0D0E] rounded-xl text-xs"
              />
              <Input
                label="Official Helpline Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white focus:border-[#FF7A1A] text-[#0D0D0E] rounded-xl text-xs tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Return Policies */}
        <div className="border border-[#E5E5E7] bg-white rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E5E5E7]">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-[#0D0D0E]">Pricing &amp; Commercial Policies</h2>
          </div>
          <p className="text-xs text-[#8E8E93] font-medium">
            Strict rules: AI will ONLY quote rates and terms explicitly listed here.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#0D0D0E] mb-1">
                Pricing &amp; Subscription Terms
              </label>
              <textarea
                rows={2}
                value={pricing}
                onChange={(e) => setPricing(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] p-2.5 text-xs text-[#0D0D0E] font-medium focus:outline-none focus:bg-white focus:border-[#FF7A1A]"
                placeholder="e.g. Starter: ₹299/mo, Growth: ₹799/mo, Business: ₹1,499/mo..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#0D0D0E] mb-1">
                Refund, Cancellation &amp; SLA Policy
              </label>
              <textarea
                rows={2}
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] p-2.5 text-xs text-[#0D0D0E] font-medium focus:outline-none focus:bg-white focus:border-[#FF7A1A]"
                placeholder="e.g. 14-day refund policy on annual plans. Cancel monthly anytime..."
                required
              />
            </div>
          </div>
        </div>

        {/* Approved FAQs */}
        <div className="border border-[#E5E5E7] bg-white rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E5E5E7]">
            <HelpCircle className="h-5 w-5 text-[#FF7A1A]" />
            <h2 className="text-base font-semibold text-[#0D0D0E]">Approved Frequently Asked Questions (FAQs)</h2>
          </div>
          <p className="text-xs text-[#8E8E93] font-medium">
            Direct question-answer pairs referenced when answering common customer enquiries.
          </p>

          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-3.5 rounded-xl bg-[#F7F7F8] border border-[#E5E5E7] flex justify-between items-start gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <span className="font-semibold text-[#0D0D0E] block">
                      Q: {faq.question}
                    </span>
                    <p className="text-[#8E8E93] font-medium">
                      A: {faq.answer}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    onClick={() => handleRemoveFaq(faq.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add FAQ Sub-form */}
            <div className="p-4 rounded-xl border border-dashed border-[#E5E5E7] bg-[#F7F7F8] space-y-3 text-xs">
              <span className="font-semibold text-[#0D0D0E] block">
                Add an Approved FAQ Item
              </span>
              <Input
                label="Customer Question"
                placeholder="e.g. Do you support broadcast marketing?"
                value={newFaqQuestion}
                onChange={(e) => setNewFaqQuestion(e.target.value)}
                className="bg-white border-[#E5E5E7] focus:border-[#FF7A1A] text-[#0D0D0E] rounded-xl text-xs"
              />
              <div>
                <label className="block text-xs font-medium text-[#0D0D0E] mb-1">
                  Approved Answer
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Yes, on Growth and Business plans..."
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5E7] bg-white p-2.5 text-xs text-[#0D0D0E] font-medium focus:outline-none focus:border-[#FF7A1A]"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-semibold rounded-xl border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] text-[#0D0D0E]"
                onClick={handleAddFaq}
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-[#FF7A1A]" />
                Add FAQ
              </Button>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end border-t border-[#E6E2D8] pt-4">
              <Button type="submit" variant="primary" className="h-10 px-5 text-[14px] font-medium rounded-[12px] shadow-xs cursor-pointer">
                Save Business Profile
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
