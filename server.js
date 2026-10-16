
"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    "https://meliibarramedina-tech.github.io"
  ]
}));
app.use(express.json());

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("Falta configurar STRIPE_SECRET_KEY.");
  process.exit(1);
}

if (!process.env.FRONTEND_URL) {
  console.error("Falta configurar FRONTEND_URL.");
  process.exit(1);
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const prices = {
  basico: 149900,
  premium: 0,
  gold: 0
};

app.get("/", (req, res) => {
  res.send("Backend de Mielé-id activo.");
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { paquete } = req.body;

    if (!Object.prototype.hasOwnProperty.call(prices, paquete)) {
      return res.status(400).json({
        error: "Paquete no válido."
      });
    }

    if (prices[paquete] <= 0) {
      return res.status(400).json({
        error: "Este paquete aún no tiene un precio configurado."
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "mxn",
          product_data: {
            name: "Mielé-id — Paquete Básico"
          },
          unit_amount: prices[paquete]
        },
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL}?pago=exito`,
      cancel_url: `${process.env.FRONTEND_URL}?pago=cancelado`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error al crear el pago:", error.message);
    res.status(500).json({
      error: "No se pudo iniciar el pago de prueba."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});
