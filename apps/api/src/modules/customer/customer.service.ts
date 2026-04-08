import prisma from "../../lib/prisma.js";
import { AppError } from "../../errors/index.js";
import { CreateCustomerInput, UpdateCustomerInput } from "./customer.types.js";

export async function createCustomer(
  data: CreateCustomerInput,
  workspaceId: string,
) {
  // Check for duplicate email within workspace
  const existing = await prisma.customer.findUnique({
    where: { email_workspaceId: { email: data.email, workspaceId } },
  });

  if (existing) {
    throw AppError.conflict("A customer with this email already exists");
  }

  return prisma.customer.create({
    data: {
      ...data,
      workspaceId,
    },
  });
}

export async function listCustomers(workspaceId: string, page = 1, limit = 25) {
  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where: { workspaceId } }),
  ]);

  return { customers, total, page, limit };
}

export async function getCustomer(id: string, workspaceId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      tickets: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!customer || customer.workspaceId !== workspaceId) {
    throw AppError.notFound("Customer not found");
  }

  return customer;
}

export async function updateCustomer(
  id: string,
  data: UpdateCustomerInput,
  workspaceId: string,
) {
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer || customer.workspaceId !== workspaceId) {
    throw AppError.notFound("Customer not found");
  }

  return prisma.customer.update({
    where: { id },
    data,
  });
}
