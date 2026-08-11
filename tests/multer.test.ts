import { describe, it } from "vitest"
import request from "supertest"
import  fs  from "node:fs"
import {prisma} from  "../lib/prisma"
import path from "node:path"
import { app } from "../app"

async function resetDb() {
	await prisma.$transaction([
		prisma.users.deleteMany(),
		prisma.session.deleteMany()
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

describe("Testing Multer", async () => {
	async function login(agent:any) {
    await resetDb()
		const cred = {username: "username", password: "Password1234!"}
		await agent.post("/signUp").type("form").send({username: cred.username , password: cred.password})
	}
  const agent = request.agent(app)
  login(agent)

	it("Image Correct", async () => {
    await agent
      .post("/account/avatar")
      .attach("avatar", __dirname +"/testFiles/avatar.jpg")
      .expect(302)
    await resetUploads()

	})


	it("Text fails", async() => {
		 await agent
			.post("/account/avatar")
			.attach("avatar", __dirname + "/testFiles/textTest.txt")
			// .expect(400)
	})
  
  it("Image Too big", async() => {
		 await agent 
			.post("/account/avatar")
			.attach("avatar", __dirname + "/testFiles/imageTooBig.png")
			// .expect(400)
	})

})

