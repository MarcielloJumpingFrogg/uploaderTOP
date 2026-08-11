import {app} from "../app"
import {describe, it, expect, test, beforeEach} from "vitest"
import  request  from "supertest"
import {prisma} from "../lib/prisma"

async function resetDb() {
	await prisma.$transaction([
		prisma.users.deleteMany(),
		prisma.session.deleteMany()
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
})

test("These tests should fail since they are trying to give invalid credentials", async () => {
  const credentials = [
    {username: "12",                          password: "Password1234!"          },
    {username: "1234567890abcdefghjklmno",    password: "Password1234!"          },
    {username: "User1234",                    password: "Pd4!"                   },
    {username: "User1235",                    password: "Pd4!1234567890234567890"},
    {username: "User1236",                    password: "password1234!"          },
    {username: "User1238",                    password: "PASSWORD1234!"          },
    {username: "User1239",                    password: "Passwordabcd!"          },	
    {username: "User1230",                    password: "123412341234!"          },
    {username: "User1231",                    password: "Password12341"          }
  ]
  for(let i = 0; i < credentials.length; i++) {
    request(app)
      .post("/signUp")
      .type("form")
      .send({username: credentials[i].username, password: credentials[i].password})
      .expect("Location", "/account")
      .expect(406)
  }
}) 



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
		.send({username: "user", password: "Password1234!"})
    .expect("Location", "/account")

	await agent
	.get("/api/login")
	.then(res =>{
		expect(res.body.user).toEqual(expect.objectContaining({username:"user"}))
	})
})

test("Trying to log in without registration", async () => {
	await resetDb()
	await request(app)
		.post("/login")
		.type("form")
		.send({username: "user", password: "Password1234!"})
		.expect("Location", "/login")
})


