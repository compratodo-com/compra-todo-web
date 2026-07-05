"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Contacto</h1>
      <p className="text-gray-500 mb-8">Estamos aquí para ayudarte. Escríbenos y te responderemos a la brevedad.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {[
          { icon: "📧", label: "Email", value: "contacto@compra-todo.com" },
          { icon: "📋", label: "Publicidad", value: "publicidad@compra-todo.com" },
          { icon: "🔒", label: "Privacidad", value: "privacidad@compra-todo.com" },
          { icon: "📍", label: "País", value: "Chile" },
        ].map((item) => (
          <Card key={item.label} className="p-4 text-center">
            <span className="text-2xl block mb-1">{item.icon}</span>
            <p className="text-xs text-gray-400">{item.label}</p>
            <p className="text-sm font-medium text-gray-900">{item.value}</p>
          </Card>
        ))}
      </div>

      {sent ? (
        <Card className="p-8 text-center bg-green-50 border-green-200">
          <span className="text-4xl block mb-3">✅</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Mensaje enviado!</h2>
          <p className="text-gray-500">Gracias por contactarnos. Te responderemos pronto.</p>
          <Button className="mt-4" onClick={() => setSent(false)}>Enviar otro mensaje</Button>
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Nombre</label>
              <Input placeholder="Tu nombre" required />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Email</label>
              <Input type="email" placeholder="tu@email.com" required />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Asunto</label>
              <Input placeholder="¿En qué podemos ayudarte?" required />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Mensaje</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px]" placeholder="Escribe tu mensaje..." required />
            </div>
            <Button type="submit" size="lg" className="w-full">Enviar mensaje ✉️</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
