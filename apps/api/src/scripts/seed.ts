import { faker } from "@faker-js/faker";
import prisma from "../lib/prisma.js";

async function main() {
  console.log("Starting database seed...");

  // Find a workspace
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    console.error("No workspace found. Please register an account first.");
    return;
  }

  // Find users in the workspace to assign tickets to
  const users = await prisma.user.findMany({
    where: { workspaceId: workspace.id },
  });
  if (users.length === 0) {
    console.error("No users found in the workspace.");
    return;
  }

  console.log(
    `Seeding data for workspace: ${workspace.company} (${workspace.id})`,
  );

  // 1. Create Tags
  const tagNames = [
    "Billing",
    "Technical",
    "Bug",
    "Feature Request",
    "Account",
    "Urgent",
  ];
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { name_workspaceId: { name, workspaceId: workspace.id } },
        update: {},
        create: { name, workspaceId: workspace.id },
      }),
    ),
  );
  console.log(`Created ${tags.length} tags.`);

  // 2. Create Customers
  const numCustomers = 15;
  const customers = [];
  for (let i = 0; i < numCustomers; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        workspaceId: workspace.id,
      },
    });
    customers.push(customer);
  }
  console.log(`Created ${customers.length} customers.`);

  // 3. Create Tickets
  const numTickets = 45;
  const statuses = ["OPEN", "PENDING", "SOLVED", "CLOSED"] as const;
  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

  let ticketNumber = 2000;

  for (let i = 0; i < numTickets; i++) {
    const isAssigned = faker.datatype.boolean({ probability: 0.8 });
    const assignee = isAssigned ? faker.helpers.arrayElement(users) : null;
    const customer = faker.helpers.arrayElement(customers);

    // Pick 1-2 random tags
    const numTags = faker.number.int({ min: 0, max: 2 });
    const ticketTags = faker.helpers
      .arrayElements(tags, numTags)
      .map((t) => ({ id: t.id }));

    const createdAtDate = faker.date.recent({ days: 30 }); // Random date in last 30 days

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: ticketNumber++,
        subject: faker.lorem.sentence({ min: 4, max: 8 }),
        description: faker.lorem.paragraphs({ min: 1, max: 3 }),
        status: faker.helpers.arrayElement(statuses),
        priority: faker.helpers.arrayElement(priorities),
        customerId: customer.id,
        assigneeId: assignee?.id || null,
        workspaceId: workspace.id,
        createdAt: createdAtDate,
        updatedAt: faker.date.between({ from: createdAtDate, to: new Date() }),
        tags: { connect: ticketTags },
      },
    });

    // 4. Create Comments
    const numComments = faker.number.int({ min: 0, max: 5 });
    let lastCommentDate = ticket.createdAt;

    for (let j = 0; j < numComments; j++) {
      lastCommentDate = faker.date.between({
        from: lastCommentDate,
        to: new Date(),
      });
      const isInternal = faker.datatype.boolean({ probability: 0.3 });

      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          // Always use a real user as author for comments
          authorId: faker.helpers.arrayElement(users).id,
          body: faker.lorem.paragraph(),
          isInternal,
          createdAt: lastCommentDate,
        },
      });
    }

    // Update ticket's updatedAt to match last comment if there are comments
    if (numComments > 0) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { updatedAt: lastCommentDate },
      });
    }
  }

  console.log(`Created ${numTickets} tickets with random comments and tags.`);
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
