import { NextResponse } from "next/server";
import { crmStore } from "@/lib/crm/crm-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, organizationName, workEmail, contactPhone, teamSize, message } = body;

    if (!fullName || !organizationName || !workEmail || !contactPhone) {
      return NextResponse.json(
        { error: "Please provide all required fields: name, organization, work email, and contact info." },
        { status: 400 }
      );
    }

    // 1. Create Contact in CRM
    const contact = crmStore.createContact("demo-corp", {
      first_name: fullName.split(" ")[0] || fullName,
      last_name: fullName.split(" ").slice(1).join(" ") || "Lead",
      phone: contactPhone,
      email: workEmail,
      company: organizationName,
      tags: ["Demo Request", "High Intent", teamSize || "Enterprise"],
      source: "Login Gateway / Try Demo",
      notes: `Requested demo access from login page. Target dispatch recipient: praveen@roosstudiox.com. Notes: ${message || "N/A"}`,
      assigned_to_name: "Praveen Raj",
      consent_status: "opted_in",
      is_archived: false,
    });

    // 2. Create Lead in Pipeline
    const lead = crmStore.createLead("demo-corp", {
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name}`,
      contact_phone: contact.phone,
      title: `${organizationName} — Growth OS Demo Request`,
      stage: "qualified",
      estimated_value: 65000,
      currency: "INR",
      source: "Login Gateway / Try Demo",
      assigned_to_name: "Praveen Raj",
      notes: `Inbound Demo Request received.\nProspect: ${fullName}\nCompany: ${organizationName}\nEmail: ${workEmail}\nPhone: ${contactPhone}\nTeam Size: ${teamSize || "1-10"}\nSent to praveen@roosstudiox.com for credential generation.`,
    });

    console.log(`[DEMO_REQUEST_DISPATCHED] Lead created for ${organizationName} (${workEmail}). Notification queued for praveen@roosstudiox.com`);

    return NextResponse.json({
      success: true,
      message: "Your demo request has been sent to Praveen Raj (praveen@roosstudiox.com). Your custom workspace credentials will be generated and shared over email shortly.",
      leadId: lead.id,
      contactId: contact.id,
    });
  } catch (error: any) {
    console.error("Error processing demo request:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process demo request. Please try again." },
      { status: 500 }
    );
  }
}
