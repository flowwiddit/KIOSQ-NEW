import {
  DeviceStatusState,
  MembershipPlan,
  ProductCategory,
  SeatStatus,
  SeatType,
  UserRole
} from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seatGroups: Array<{
  prefix: string;
  label: string;
  type: SeatType;
  count: number;
  zone: string;
  hourlyRateKrw: number;
}> = [
  { prefix: "OD", label: "Open Desk", type: SeatType.OPEN_DESK, count: 24, zone: "Atrium", hourlyRateKrw: 2500 },
  { prefix: "QZ", label: "Quiet Zone", type: SeatType.QUIET_ZONE, count: 18, zone: "Library", hourlyRateKrw: 3200 },
  { prefix: "PD", label: "Premium Desk", type: SeatType.PREMIUM_DESK, count: 12, zone: "Premium", hourlyRateKrw: 4500 },
  { prefix: "FB", label: "Focus Booth", type: SeatType.FOCUS_BOOTH, count: 8, zone: "Focus", hourlyRateKrw: 6000 },
  { prefix: "MR", label: "Meeting Room", type: SeatType.MEETING_ROOM, count: 4, zone: "Studio", hourlyRateKrw: 12000 }
];

const products = [
  {
    name: "Signature Americano",
    slug: "signature-americano",
    category: ProductCategory.COFFEE,
    description: "Single-origin espresso over mineral-balanced water.",
    priceKrw: 4500,
    stock: 120
  },
  {
    name: "Cold Brew Reserve",
    slug: "cold-brew-reserve",
    category: ProductCategory.COFFEE,
    description: "Slow-steeped coffee with cacao and citrus notes.",
    priceKrw: 5800,
    stock: 80
  },
  {
    name: "Jeju Green Tea",
    slug: "jeju-green-tea",
    category: ProductCategory.TEA,
    description: "Premium Jeju-grown green tea served hot or iced.",
    priceKrw: 5200,
    stock: 70
  },
  {
    name: "Focus Energy Drink",
    slug: "focus-energy-drink",
    category: ProductCategory.ENERGY_DRINK,
    description: "Low-sugar caffeine and vitamin blend for long sessions.",
    priceKrw: 3900,
    stock: 96
  },
  {
    name: "Protein Granola Bar",
    slug: "protein-granola-bar",
    category: ProductCategory.SNACK,
    description: "Almond, oat, and honey snack for sustained energy.",
    priceKrw: 3200,
    stock: 150
  },
  {
    name: "A4 Printing Credit",
    slug: "a4-printing-credit",
    category: ProductCategory.PRINTING,
    description: "Ten black-and-white A4 pages for self-service printing.",
    priceKrw: 1000,
    stock: 1000
  }
];

async function main() {
  for (const role of Object.values(UserRole)) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: {
        name: role,
        description:
          role === UserRole.OWNER
            ? "Full operational control"
            : role === UserRole.STAFF
              ? "Cafe operations and customer support"
              : "Customer self-service portal"
      }
    });
  }

  for (const group of seatGroups) {
    for (let index = 1; index <= group.count; index += 1) {
      const code = `${group.prefix}-${String(index).padStart(2, "0")}`;
      await prisma.seat.upsert({
        where: { code },
        update: {
          name: `${group.label} ${index}`,
          type: group.type,
          zone: group.zone,
          hourlyRateKrw: group.hourlyRateKrw
        },
        create: {
          code,
          name: `${group.label} ${index}`,
          type: group.type,
          status: index === group.count && group.type === SeatType.FOCUS_BOOTH ? SeatStatus.MAINTENANCE : SeatStatus.AVAILABLE,
          floor: group.type === SeatType.MEETING_ROOM ? 2 : 1,
          zone: group.zone,
          hourlyRateKrw: group.hourlyRateKrw
        }
      });
    }
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product
    });
  }

  const pricingRules = [
    {
      key: "daily-pass",
      label: "Daily Pass",
      amountKrw: 18000,
      description: "12 hours of same-day cafe access."
    },
    {
      key: "weekly-pass",
      label: "Weekly Pass",
      amountKrw: 89000,
      description: "70 hours valid for seven days."
    },
    {
      key: "monthly-membership",
      label: "Monthly Membership",
      amountKrw: 249000,
      description: "240 hours valid for thirty days."
    },
    {
      key: "reservation-fee",
      label: "Priority Reservation",
      amountKrw: 2000,
      description: "Seat reservation guarantee fee."
    }
  ];

  for (const rule of pricingRules) {
    await prisma.pricingRule.upsert({
      where: { key: rule.key },
      update: rule,
      create: rule
    });
  }

  const devices = [
    { name: "Entrance Kiosk", type: "kiosk", location: "Main Entrance", status: DeviceStatusState.ONLINE },
    { name: "Exit Gate", type: "access-control", location: "Main Exit", status: DeviceStatusState.ONLINE },
    { name: "Printer A", type: "printer", location: "Service Bar", status: DeviceStatusState.ONLINE },
    { name: "Locker Hub", type: "locker", location: "North Wall", status: DeviceStatusState.DEGRADED },
    { name: "Climate Sensor", type: "sensor", location: "Quiet Zone", status: DeviceStatusState.ONLINE }
  ];

  for (const device of devices) {
    await prisma.deviceStatus.upsert({
      where: { id: device.name.toLowerCase().replaceAll(" ", "-") },
      update: device,
      create: {
        id: device.name.toLowerCase().replaceAll(" ", "-"),
        ...device
      }
    });
  }

  await prisma.pricingRule.upsert({
    where: { key: MembershipPlan.MONTHLY_MEMBERSHIP.toLowerCase() },
    update: {},
    create: {
      key: MembershipPlan.MONTHLY_MEMBERSHIP.toLowerCase(),
      label: "Monthly Member Renewal",
      amountKrw: 249000,
      description: "Renewal price for active monthly members."
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
