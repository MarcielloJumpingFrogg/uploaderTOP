import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"
import { result } from "../config/db"

//const connectionString = result

//const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL})
const adapter = new PrismaPg({ connectionString: result})
const prisma = new PrismaClient({ adapter })

export { prisma }
