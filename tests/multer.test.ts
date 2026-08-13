import { beforeEach, describe, it } from "vitest"
import request from "supertest"
import  fs  from "node:fs"
import {prisma} from  "../lib/prisma"
import path from "node:path"
import { app } from "../app"

async function resetDb() {
	await prisma.$transaction([
    prisma.files.deleteMany(),
		prisma.users.deleteMany(),
		prisma.session.deleteMany(),
	])
}


async function resetUploads() {
  const dir = __dirname + "/testUploads/"
  console.log("the other dir: ", dir)
  fs.readdir(dir, (err, files) => {
    if (err) throw err 
    for (const file of files) {
      fs.unlink(path.join(dir, file), err => {
        if(err) throw err
      })
    }
  })
}

describe("Testing Multer", () => {
  
  beforeEach(async () => {
    await resetUploads()
    await resetDb()
  })


  const agent = request.agent(app)
	it("Image Correct", async () => {
    const cred = {username: "username", password: "Password1234!"}
    const response = await agent.post("/signUp").type("form").send({username: cred.username , password: cred.password})
    await agent
      .post("/account/avatar")
      .attach("avatar", __dirname +"/testFiles/avatar.jpg")
      .expect(302)

	})


	it("Text fails", async() => {
    const cred = {username: "username", password: "Password1234!"}
    const response = await agent.post("/signUp").type("form").send({username: cred.username , password: cred.password})
		 await agent
			.post("/account/avatar")
			.attach("avatar", __dirname + "/testFiles/textTest.txt")
			.expect(400)
	})
  
  it("Image Too big", async() => {
    const cred = {username: "username", password: "Password1234!"}
    const response = await agent.post("/signUp").type("form").send({username: cred.username , password: cred.password})
		 await agent 
			.post("/account/avatar")
			.attach("avatar", __dirname + "/testFiles/imageTooBig.png")
			.expect(400)
	})

})

