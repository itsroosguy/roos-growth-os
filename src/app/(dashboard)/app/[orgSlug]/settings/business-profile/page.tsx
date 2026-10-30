"use client";

import React, { useState } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { businessContextStore } from "@/lib/ai/business-context-store";
import { FAQItem } from "@/lib/ai/types";
import {
  Building2,
  CheckCircle2,
  Plus,
  Trash2,
  ShieldCheck,
  HelpCircle,
  ArrowLeft,
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EDE8E0]">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight text-[#12141A] tracking-[-0.02em]">
            Business Knowledge Profile
          </h1>
          <p className="text-[14px] text-[#666C78] mt-1 font-normal">
            Verified company facts, approved pricing, and FAQs used to ground AI responses for {currentOrg.name}.
          </p>
        </div>

        <Link href={`/app/${currentOrg.slug}/settings/ai`}>
          <Button variant="outline" className="h-10 px-4 text-[13.5px] font-medium rounded-[12px] border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#12141A] shadow-xs cursor-pointer flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4 text-[#666C78]" />
            <span>Back to AI Settings</span>
          </Button>
        </Link>
      </div>

      {saved && (
        <div className="rounded-[12px] bg-[#E4F7EF] p-4 border border-[#BDECD7] text-[13.5px] text-[#0A7A53] flex items-center space-x-2 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0A7A53]" />
          <span className="font-semibold">Business knowledge profile saved and active for AI grounding!</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="border border-[#EDE8E0] bg-white rounded-[16px] card-ref p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#EDE8E0]">
            <Building2 className="h-5 w-5 text-[#FF5A1F]" />
            <h2 className="text-[17px] font-semibold text-[#12141A]">Company Identity &amp; Services</h2>
          </div>
          <p className="text-[13px] text-[#666C78] font-normal">
            These approved facts are injected into system prompts so the AI never invents company policies or unapproved products.
          </p>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Registered Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F] text-[#12141A] rounded-[12px] text-[13.5px]"
              />
              <Input
                label="Service Area / Geographical Coverage"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                required
                className="bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F] text-[#12141A] rounded-[12px] text-[13.5px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#12141A]">
                Company Overview &amp; Value Proposition
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] p-3 text-[13.5px] text-[#12141A] font-normal focus:outline-none focus:bg-white focus:border-[#FF5A1F]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#12141A]">
                Products &amp; Commercial Offerings
              </label>
              <textarea
                rows={2}
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                className="w-full rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] p-3 text-[13.5px] text-[#12141A] font-normal focus:outline-none focus:bg-white focus:border-[#FF5A1F]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Operating Hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
                className="bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F] text-[#12141A] rounded-[12px] text-[13.5px]"
              />
              <Input
                label="Official Contact Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F] text-[#12141A] rounded-[12px] text-[13.5px]"
              />
              <Input
                label="Official Helpline Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F] text-[#12141A] rounded-[12px] text-[13.5px] tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Return Policies */}
        <div className="border border-[#EDE8E0] bg-white rounded-[16px] card-ref p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#EDE8E0]">
            <ShieldCheck className="h-5 w-5 text-[#12B886]" />
            <h2 className="text-[17px] font-semibold text-[#12141A]">Pricing &amp; Commercial Policies</h2>
          </div>
          <p className="text-[13px] text-[#666C78] font-normal">
            Strict rules: AI will ONLY quote rates and terms explicitly listed here.
          </p>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#12141A]">
                Pricing &amp; Subscription Terms
              </label>
              <textarea
                rows={2}
                value={pricing}
                onChange={(e) => setPricing(e.target.value)}
                className="w-full rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] p-3 text-[13.5px] text-[#12141A] font-normal focus:outline-none focus:bg-white focus:border-[#FF5A1F]"
                placeholder="e.g. Starter: ₹299/mo, Growth: ₹799/mo, Business: ₹1,499/mo..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#12141A]">
                Refund, Cancellation &amp; SLA Policy
              </label>
              <textarea
                rows={2}
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                className="w-full rounded-[12px] border border-[#EDE8E0] bg-[#F7F5F0] p-3 text-[13.5px] text-[#12141A] font-normal focus:outline-none focus:bg-white focus:border-[#FF5A1F]"
                placeholder="e.g. 14-day refund policy on annual plans. Cancel monthly anytime..."
                required
              />
            </div>
          </div>
        </div>

        {/* Approved FAQs */}
        <div className="border border-[#EDE8E0] bg-white rounded-[16px] card-ref p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#EDE8E0]">
            <HelpCircle className="h-5 w-5 text-[#FF5A1F]" />
            <h2 className="text-[17px] font-semibold text-[#12141A]">Approved Frequently Asked Questions (FAQs)</h2>
          </div>
          <p className="text-[13px] text-[#666C78] font-normal">
            Direct question-answer pairs referenced when answering common customer enquiries.
          </p>

          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-3.5 rounded-[12px] bg-[#F7F5F0] border border-[#EDE8E0] flex justify-between items-start gap-4"
                >
                  <div className="space-y-1 text-[13px]">
                    <span className="font-semibold text-[#12141A] block">
                      Q: {faq.question}
                    </span>
                    <p className="text-[#666C78] font-normal">
                      A: {faq.answer}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[#E5484D] hover:bg-[#FFE9EA] rounded-[8px] cursor-pointer"
                    onClick={() => handleRemoveFaq(faq.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add FAQ Sub-form */}
            <div className="p-4 rounded-[14px] border border-dashed border-[#EDE8E0] bg-[#F7F5F0] space-y-3 text-[13px]">
              <span className="font-semibold text-[#12141A] block">
                Add an Approved FAQ Item
              </span>
              <Input
                label="Customer Question"
                placeholder="e.g. Do you support broadcast marketing?"
                value={newFaqQuestion}
                onChange={(e) => setNewFaqQuestion(e.target.value)}
                className="bg-white border-[#EDE8E0] focus:border-[#FF5A1F] text-[#12141A] rounded-[12px] text-[13.5px]"
              />
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#12141A]">
                  Approved Answer
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Yes, on Growth and Business plans..."
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  className="w-full rounded-[12px] border border-[#EDE8E0] bg-white p-3 text-[13.5px] text-[#12141A] font-normal focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[13px] font-semibold rounded-[10px] border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#12141A] cursor-pointer"
                onClick={handleAddFaq}
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-[#FF5A1F]" />
                Add FAQ
              </Button>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end border-t border-[#EDE8E0] pt-4">
              <Button type="submit" variant="primary" className="h-10 px-5 text-[14px] font-semibold rounded-[12px] shadow-xs cursor-pointer">
                Save Business Profile
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
