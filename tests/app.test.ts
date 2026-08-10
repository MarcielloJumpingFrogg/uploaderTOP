import {app} from "../app"
import { createRequire } from "node:module"
import {describe, it, expect, test, beforeEach} from "vitest"
const require = createRequire(import.meta.url)
const request = require("supertest")
import fs from "node:fs"
// import { dirname } from "node:path"
import {prisma} from "../lib/prisma"
import path from "node:path/posix"

async function resetDb() {
	await prisma.$transaction([
		prisma.users.deleteMany(),
		prisma.session.deleteMany(),
	])
}

async function resetUploads() {
  const dir = __dirname + "/testUploads/"
  fs.readdir(dir, (err, files) => {
    if (err) throw err 
    for (const file of files) {
      fs.unlink(path.join(dir, file), err => {
        if(err) throw err
      })
    }
  })
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
})

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

test("Log in after registration", async () => {
	await resetDb()
	const agent = request.agent(app)
	await agent
		.post("/signUp")
		.type("form")
		.send({username: "username", password: "Password1234!"})
		.expect(302)

	await agent 
		.post("/login")
		.type("form")
		.send({username: "username", password: "Password1234!"})
		.expect(302)
		.expect("Location", "/account")

	await agent
	.get("/api/login")
	.then(res =>{
		expect(res.body.user).toEqual(expect.objectContaining({username:"username"}))
	})
})

test("Trying to log in without registration", async () => {
	await resetDb()
	await request(app)
		.post("/login")
		.type("form")
		.send({username: "user", password: "Password1234!"})
		.expect(302)
		.expect("Location", "/")
})


describe("Testing Multer", () => {
	async function login(agent:any) {
		await resetDb()
		const cred = {username: "username", password: "Password1234!"}
		await agent.post("/signUp").type("form").send({username: cred.username , password: cred.password}).expect(302)
		await agent.post("/login").type("form").send({username: cred.username, password: cred.password}).expect(302)

	}

	it("Image Correct", async () => {
    const agent = request.agent(app)
    login(agent)
    await agent
      .post("/account")
      .attach("avatar", __dirname +"/testFiles/avatar.jpg")
      .expect(302)
    resetUploads()
	})


	it("Text fails", async() => {
		const agent = request.agent(app)
		await login(agent)
		 await agent 
			.post("/account")
			.attach("avatar", __dirname + "/testFiles/textTest.txt")
			.expect(400)
	})
  
  it("Image Too big", async() => {
		const agent = request.agent(app)
		await login(agent)
		 await agent 
			.post("/account")
			.attach("avatar", __dirname + "/testFiles/imageTooBig.png")
			.expect(400)
	})
})

