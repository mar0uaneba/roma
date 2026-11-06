import type { Customer, EmailLog, Order, OrderItem, OrderStatus, QuoteRequest } from "@/lib/shop/types";

/*
 * Sample data shown in the admin while no database is connected, so the screens can be reviewed.
 * Everything here is fictional and clearly labelled "Demo" in the interface. Nothing is ever saved.
 */

const DAY = 86_400_000;
const base = Date.now();
const at = (daysAgo: number, hour = 10) => new Date(base - daysAgo * DAY + (hour - 10) * 3_600_000).toISOString();

const catalog = [
  { slug: "boites-patisserie", name: "Boîtes pâtisserie", image: "/images/pastry-box.jpg", unit: "carton de 100", price: 290, cost: 205 },
  { slug: "sacs-kraft-poignees", name: "Sacs kraft à poignées", image: "/images/kraft-bag.jpg", unit: "lot de 250", price: 480, cost: 330 },
  { slug: "gobelets-boissons-chaudes", name: "Gobelets boissons chaudes", image: "/images/paper-cup.jpg", unit: "carton de 1 000", price: 650, cost: 470 },
  { slug: "barquettes-repas", name: "Barquettes repas", image: "/images/bowl.jpg", unit: "carton de 300", price: 720, cost: 520 },
  { slug: "boites-postales", name: "Boîtes postales e-commerce", image: "/images/mailer-box.jpg", unit: "lot de 50", price: 260, cost: 170 },
  { slug: "rubans-adhesifs", name: "Rubans adhésifs", image: "/images/tape.jpg", unit: "carton de 36", price: 310, cost: 215 },
];

const people: Customer[] = [
  ["c1", "Salma Bennani", "Pâtisserie Les Délices", "salma@example.ma", "+212 6 11 22 33 44", "Rabat", "customer", "fr"],
  ["c2", "Youssef El Amrani", "Café Tanja", "youssef@example.ma", "+212 6 22 33 44 55", "Tanger", "vip", "fr"],
  ["c3", "Khadija Alaoui", "Snack Alaoui", "khadija@example.ma", "+212 6 33 44 55 66", "Salé", "customer", "ar"],
  ["c4", "Omar Tazi", "Tazi Store (e-commerce)", "omar@example.ma", "+212 6 44 55 66 77", "Casablanca", "customer", "fr"],
  ["c5", "Imane Chraibi", "Traiteur Chraibi", null, "+212 6 55 66 77 88", "Témara", "lead", "ar"],
  ["c6", "Hamza Idrissi", "Boulangerie Idrissi", "hamza@example.ma", "+212 6 66 77 88 99", "Kénitra", "inactive", "fr"],
].map(([id, name, company, email, phone, city, stage, locale]) => ({
  id: id as string,
  name: name as string,
  company: company as string,
  email: email as string | null,
  phone: phone as string,
  city: city as string,
  address: "Quartier Agdal, Rue 12",
  locale: locale as "fr" | "ar",
  stage: stage as Customer["stage"],
  tags: stage === "vip" ? ["gros volume"] : [],
  notes: null,
  createdAt: at(80),
}));

type Spec = [id: string, customer: string, daysAgo: number, status: OrderStatus, paid: boolean, lines: [number, number][]];

const specs: Spec[] = [
  ["o1", "c2", 0.2, "pending", false, [[2, 3], [0, 2]]],
  ["o2", "c1", 0.6, "pending", false, [[0, 4]]],
  ["o3", "c4", 1, "confirmed", false, [[4, 6], [5, 2]]],
  ["o4", "c3", 2, "confirmed", false, [[3, 2], [1, 1]]],
  ["o5", "c2", 3, "shipped", false, [[2, 5]]],
  ["o6", "c1", 5, "delivered", true, [[0, 6], [1, 2]]],
  ["o7", "c4", 8, "delivered", true, [[4, 10], [5, 3]]],
  ["o8", "c2", 12, "delivered", true, [[2, 8], [1, 4]]],
  ["o9", "c6", 15, "cancelled", false, [[1, 1]]],
  ["o10", "c3", 18, "delivered", true, [[3, 3]]],
  ["o11", "c1", 23, "delivered", true, [[0, 5]]],
  ["o12", "c4", 27, "refunded", false, [[4, 2]]],
  ["o13", "c2", 34, "delivered", true, [[2, 10], [0, 3]]],
  ["o14", "c5", 0.1, "draft", false, [[3, 4]]],
];

let cache: Order[] | null = null;

export function demoOrders(): Order[] {
  if (cache) return cache;
  cache = specs.map(([id, customerId, daysAgo, status, paid, lines], index) => {
    const customer = people.find((person) => person.id === customerId)!;
    const items: OrderItem[] = lines.map(([productIndex, quantity], line) => {
      const product = catalog[productIndex]!;
      return {
        id: `${id}-${line}`,
        productSlug: product.slug,
        name: product.name,
        image: product.image,
        unit: product.unit,
        quantity,
        unitPrice: product.price,
        unitCost: product.cost,
        lineTotal: quantity * product.price,
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const shipping = subtotal >= 2000 ? 0 : 40;
    const created = at(daysAgo, 9 + (index % 8));
    const later = (hours: number) => new Date(Date.parse(created) + hours * 3_600_000).toISOString();
    const reached = (stage: OrderStatus[]) => stage.includes(status);
    return {
      id,
      number: `RP-${1001 + index}`,
      status,
      paymentMethod: "cod",
      paymentStatus: paid ? "paid" : status === "refunded" ? "refunded" : "unpaid",
      source: status === "draft" ? "admin" : "shop",
      locale: customer.locale,
      customerId,
      customerName: customer.name,
      customerCompany: customer.company,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerCity: customer.city,
      customerAddress: customer.address,
      customerNote: null,
      subtotal,
      shipping,
      discount: 0,
      total: subtotal + shipping,
      costTotal: items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
      refundedAmount: status === "refunded" ? subtotal + shipping : 0,
      carrier: reached(["shipped", "delivered"]) ? "Amana" : null,
      trackingNumber: reached(["shipped", "delivered"]) ? `AM${400200 + index}MA` : null,
      supplierRef: null,
      deliverySlot: null,
      deliveryNote: null,
      damageFlag: false,
      internalNote: null,
      cancelReason: status === "cancelled" ? "Client injoignable" : null,
      offerToken: status === "draft" ? "demo-offer-token-0000000000" : null,
      offerExpiresAt: null,
      offerSentAt: null,
      quoteId: null,
      confirmedAt: reached(["confirmed", "shipped", "delivered", "refunded"]) ? later(2) : null,
      shippedAt: reached(["shipped", "delivered"]) ? later(26) : null,
      deliveredAt: reached(["delivered"]) ? later(50) : null,
      paidAt: paid ? later(50) : null,
      cancelledAt: status === "cancelled" ? later(5) : null,
      createdAt: created,
      updatedAt: created,
      items,
    } satisfies Order;
  });
  return cache;
}

export function demoCustomers() {
  return people;
}

export function demoEmails(): EmailLog[] {
  return [
    {
      id: "m1",
      customerId: "c1",
      orderId: "o6",
      toEmail: "salma@example.ma",
      subject: "Votre commande RP-1006 est expédiée",
      html: "<p>Bonjour Salma,</p><p>Votre commande RP-1006 est partie avec Amana.</p>",
      kind: "shipped",
      status: "sent",
      error: null,
      createdAt: at(4),
    },
  ];
}

export function demoQuotes(): QuoteRequest[] {
  return [
    {
      id: "q1",
      company: "Hôtel Atlas",
      contactName: "Nadia Berrada",
      email: "nadia@example.ma",
      phone: "+212 6 77 88 99 00",
      city: "Marrakech",
      sector: "Restaurants et traiteurs",
      product: "Emballages à votre marque",
      quantity: "5 000 / mois",
      message: "Sacs kraft imprimés avec notre logo pour le room service.",
      status: "new",
      locale: "fr",
      draftOrderId: null,
      createdAt: at(0.4),
    },
  ];
}
