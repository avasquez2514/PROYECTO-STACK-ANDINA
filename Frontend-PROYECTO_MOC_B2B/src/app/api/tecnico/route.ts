// /app/api/tecnico/route.js
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("📩 Datos recibidos en Next:", data);

    // 🚀 Reenviar a Django
    const response = await fetch("http://127.0.0.1:8000/api/soporte/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fecha_hora: new Date().toISOString(), // fecha/hora actual
        en_sitio: data.enSitio === "SI",
        nombre: data.nombre,
        celular: data.celular,
        torre: data.torre,
        incidente: data.incidente, // 👈 corregido
        gestion: data.gestion,
        tipo_servicio: data.tecnologia || "N/A", // 👈 evita vacío
        observaciones: data.observaciones,
        observaciones_ultima: data.observaciones || "Sin observaciones", // 👈 obligatorio
        plantilla: JSON.stringify(data.plantillaExtra),
        login_n1: "vasquez",
        estado: data.gestion === "CIERRE" ? "CERRADO" : "ABIERTO",
      }),
    });

    // 👇 Leemos la respuesta solo una vez como texto
    const rawText = await response.text();

    let result;
    try {
      result = JSON.parse(rawText); // Intentamos parsear JSON
    } catch {
      console.error("❌ Django devolvió HTML o error:", rawText);
      return NextResponse.json(
        { ok: false, error: "Respuesta no válida desde Django", detalle: rawText },
        { status: 500 }
      );
    }

    console.log("📤 Respuesta de Django:", result);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("❌ Error enviando a Django:", error);
    return NextResponse.json(
      { error: "Error al enviar los datos a Django" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/soportes/");
    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("❌ Django devolvió HTML en GET:", rawText);
      return NextResponse.json(
        { ok: false, error: "Respuesta no válida desde Django", detalle: rawText },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error en GET:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de Django" },
      { status: 500 }
    );
  }
}
