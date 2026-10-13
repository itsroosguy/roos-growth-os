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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Business Knowledge & Grounding Profile
            </h1>
            <Badge variant="success" className="text-xs">
              Anti-Hallucination Grounding
            </Badge>
          </div>
          <p className="text-sm text-foreground-secondary mt-1">
            Verified company facts, approved pricing, and FAQs used to ground AI responses for {currentOrg.name}.
          </p>
        </div>

        <Link href={`/app/${currentOrg.slug}/settings/ai`}>
          <Button variant="outline" size="sm" className="text-xs">
            Back to AI Settings
          </Button>
        </Link>
      </div>

      {saved && (
        <div className="rounded-2xl bg-google-green-subtle p-3.5 border border-google-green/30 text-xs text-google-green flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Business knowledge profile saved and active for AI grounding!</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-google-blue" />
              <CardTitle className="text-base">Company Identity & Services</CardTitle>
            </div>
            <CardDescription className="text-xs">
              These approved facts are injected into system prompts so the AI never invents company policies or unapproved products.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Registered Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
              <Input
                label="Service Area / Geographical Coverage"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Company Overview & Value Proposition
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-border p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-google-blue"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Products & Commercial Offerings
              </label>
              <textarea
                rows={2}
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                className="w-full rounded-xl border border-border p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-google-blue"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Operating Hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
              />
              <Input
                label="Official Contact Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Official Helpline Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Return Policies */}
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-google-green" />
              <CardTitle className="text-base">Pricing & Commercial Policies</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Strict rules: AI will ONLY quote rates and terms explicitly listed here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Pricing & Subscription Terms
              </label>
              <textarea
                rows={2}
                value={pricing}
                onChange={(e) => setPricing(e.target.value)}
                className="w-full rounded-xl border border-border p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-google-blue"
                placeholder="e.g. Starter: ₹299/mo, Growth: ₹799/mo, Business: ₹1,499/mo..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Refund, Cancellation & SLA Policy
              </label>
              <textarea
                rows={2}
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                className="w-full rounded-xl border border-border p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-google-blue"
                placeholder="e.g. 14-day refund policy on annual plans. Cancel monthly anytime..."
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Approved FAQs */}
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-google-blue" />
              <CardTitle className="text-base">Approved Frequently Asked Questions (FAQs)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Direct question-answer pairs referenced when answering common customer enquiries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-3.5 rounded-xl bg-surface-subtle border border-border flex justify-between items-start gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <span className="font-semibold text-foreground block">
                      Q: {faq.question}
                    </span>
                    <p className="text-foreground-secondary">
                      A: {faq.answer}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-google-red hover:bg-google-red-subtle"
                    onClick={() => handleRemoveFaq(faq.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add FAQ Sub-form */}
            <div className="p-4 rounded-xl border border-dashed border-border bg-surface space-y-3 text-xs">
              <span className="font-semibold text-foreground block">
                Add an Approved FAQ Item
              </span>
              <Input
                label="Customer Question"
                placeholder="e.g. Do you support broadcast marketing?"
                value={newFaqQuestion}
                onChange={(e) => setNewFaqQuestion(e.target.value)}
              />
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Approved Answer
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Yes, on Growth and Business plans..."
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  className="w-full rounded-xl border border-border p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-google-blue"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleAddFaq}
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-google-blue" />
                Add FAQ
              </Button>
            </div>
          </CardContent>
          {isAdmin && (
            <CardFooter className="flex justify-end border-t border-border pt-4">
              <Button type="submit" variant="default" size="sm">
                Save Business Profile
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
    </div>
  );
}
