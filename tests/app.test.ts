import {app} from "../app"
import { createRequire } from "node:module"
import {describe, it, expect, test, beforeEach, vi} from "vitest"
const require = createRequire(import.meta.url)
const request = require("supertest")
import {prisma} from "../lib/prisma"

async function resetDb() {
	await prisma.$transaction([
		prisma.users.deleteMany(),
		prisma.session.deleteMany(),
	])
}

beforeEach(()=>{
	resetDb()
})

test("checking if i am capable of connecting to my site", () => {
request(app)
	.get("/")
	.expect("Content-type", /html/)
	.expect("Location", "/login")
	.expect(200)
}
)

test("We should be able to create an account on signUp", async () => {
	request(app)
		.post("/signUp")
		.type("form")
		.send({username: "testName", password: "Password1234!"})
		.expect("Location", "/account")
		.expect(200)
}) 

describe("These tests should fail since they are trying to give invalid credentials", async () => {
	it("username too short", async ()=>{
	request(app)
		.post("/signUp")
		.type("form")
		.send({username: "12", password: "Password1234!"})
		.expect(406)
	})

	it("Username too long", async () => {
		request(app)
			.post("/signUp")
			.type("form")
			.send({username: "1234567890abcdefghjklmno", password: "Password1234!"})
			.expect(406)
	})

	it("Password too short", async () => {
		request(app)
			.post("/signUp")
			.type("form")
			.send({username: "1234", password: "Pd4!"})
			.expect(406)
	})

	it("Password too long", async () => {
		request(app)
			.post("/signUp")
			.type("form")
			.send({username: "1234", password: "Pd4!12345678901234567890"})
			.expect(406)
	})

		it("Password no UpperCase", async () => {
		request(app)
			.post("/signUp")
			.type("form")
			.send({username: "1234", password: "password1234!"})
			.expect(406)
	})

		it("Password no lowerCase", async () => {
		request(app)
			.post("/signUp")
			.type("form")
			.send({username: "1234", password: "PASSWORD1234!"})
			.expect(406)
	})
		it("Password no numbers", async () => {
		request(app)
			.post("/signUp")
			.type("form")
			.send({username: "1234", password: "Passwordabcd!"})
			.expect(406)
	})
		it("Password no letters", async () => {
		request(app)
			.post("/signUp")
			.type("form")
			.send({username: "1234", password: "123412341234!"})
			.expect(406)
	})
		it("Password no symbols", async () => {
		request(app)
			.post("/signUp")
			.type("form")
			.send({username: "1234", password: "Password12341"})
			.expect(406)
	})
} )

it("Same username", async () => {
	request(app)
		.post("/signUp")
		.type("form")
		.send({username: "username", password: "Password1234!"})
		.expect(200)

		request(app)
		.post("/signUp")
		.type("form")
		.send({username: "username", password: "AnotherPass123!"})
		.expect(403)
})

test("Auto Log in after registration", async () => {
	request(app)
		.post("/signUp")
		.type("form")
		.send({username: "username", password: "Password1234!"})
		.expect(200)

	request(app)
		.post("/login")
		.type("form")
		.send({username:"ciao", password: "Password1234!"})
		.expect(300)
		.expect("Location", "/signUp")

})
