import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import ContactForm from "./contact-form";

export const metadata: Metadata = buildMetadata({
  title: "Contacto | Compra-Todo",
  description: "Ponte en contacto con el equipo de Compra-Todo. Estamos aquí para ayudarte.",
  path: "/contact",
  noindex: true,
});

export default function ContactPage() {
  return <ContactForm />;
}
