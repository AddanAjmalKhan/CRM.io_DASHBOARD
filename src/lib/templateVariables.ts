export interface TemplateVariable {
  key: string;
  label: string;
  preview: string;
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: "fullName",     label: "Full Name",     preview: "John Smith" },
  { key: "firstName",    label: "First Name",    preview: "John" },
  { key: "lastName",     label: "Last Name",     preview: "Smith" },
  { key: "businessName", label: "Business Name", preview: "Smith Enterprises LLC" },
  { key: "serialNumber", label: "Serial #",       preview: "BH-2024-001" },
  { key: "email",        label: "Email",          preview: "john@example.com" },
  { key: "address",      label: "Address",        preview: "123 Main St, Suite 400" },
  { key: "agentName",    label: "Agent Name",     preview: "Jane Cooper" },
  { key: "date",         label: "Date",           preview: "January 1, 2025" },
  { key: "time",         label: "Time",           preview: "3:45 PM" },
];

export const TEMPLATE_PREVIEW_VARS: Record<string, string> =
  Object.fromEntries(TEMPLATE_VARIABLES.map(v => [v.key, v.preview]));
